"""
RAG (Retrieval Augmented Generation) Service

This module provides document parsing and context retrieval from user-uploaded
knowledge assets. It supports PDF, TXT, MD, and DOCX files.
"""

import io
import bson
from typing import List, Dict, Optional
from app.models import UserAsset
from beanie.operators import In

try:
    from langchain_community.vectorstores import FAISS
    from langchain_huggingface import HuggingFaceEmbeddings
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

# Optional imports for document parsing
try:
    import PyPDF2
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


class RAGService:
    """Service for extracting and retrieving content from knowledge assets."""
    
    @staticmethod
    async def get_asset_content(asset_id: str) -> Optional[str]:
        """
        Extract text content from a user asset.
        
        Supports:
        - PDF files
        - Plain text (.txt)
        - Markdown (.md)
        - Word documents (.docx)
        """
        asset = await UserAsset.get(asset_id)
        if not asset:
            return None
        
        content_type = asset.content_type.lower()
        filename = asset.filename.lower()
        
        try:
            # PDF files
            if content_type == "application/pdf" or filename.endswith(".pdf"):
                return RAGService._extract_pdf(asset.file_data)
            
            # Plain text and markdown
            elif content_type in ["text/plain", "text/markdown"] or \
                 filename.endswith((".txt", ".md")):
                return asset.file_data.decode("utf-8", errors="ignore")
            
            # Word documents
            elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or \
                 filename.endswith(".docx"):
                return RAGService._extract_docx(asset.file_data)
            
            # JSON files
            elif content_type == "application/json" or filename.endswith(".json"):
                return asset.file_data.decode("utf-8", errors="ignore")
            
            else:
                # Try to decode as text
                try:
                    return asset.file_data.decode("utf-8", errors="ignore")
                except:
                    return f"[Binary file: {asset.filename}]"
                    
        except Exception as e:
            return f"[Error extracting content from {asset.filename}: {str(e)}]"
    
    @staticmethod
    def _extract_pdf(file_data: bytes) -> str:
        """Extract text from PDF bytes."""
        if not HAS_PYPDF:
            return "[PDF parsing not available - install PyPDF2]"
        
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_data))
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            return "\n\n".join(text_parts)
        except Exception as e:
            return f"[Error reading PDF: {str(e)}]"
    
    @staticmethod
    def _extract_docx(file_data: bytes) -> str:
        """Extract text from DOCX bytes."""
        if not HAS_DOCX:
            return "[DOCX parsing not available - install python-docx]"
        
        try:
            doc = docx.Document(io.BytesIO(file_data))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as e:
            return f"[Error reading DOCX: {str(e)}]"
    
    @staticmethod
    async def get_multiple_assets_content(asset_ids: List[str]) -> Dict[str, str]:
        """
        Extract content from multiple assets.

        Uses a single batch query (no N+1) and returns a dict mapping asset_id -> content.
        """
        if not asset_ids:
            return {}

        # ⚡ Batch fetch – one DB round-trip instead of N
        valid_ids = []
        for aid in asset_ids:
            try:
                valid_ids.append(bson.ObjectId(aid))
            except Exception:
                pass

        if not valid_ids:
            return {}

        assets = await UserAsset.find(In(UserAsset.id, valid_ids)).to_list()

        results = {}
        for asset in assets:
            content = RAGService._extract_content_from_asset(asset)
            if content:
                results[str(asset.id)] = content
        return results

    @staticmethod
    def _extract_content_from_asset(asset: UserAsset) -> Optional[str]:
        """Extract text from an already-fetched UserAsset (sync, no DB call)."""
        content_type = asset.content_type.lower()
        filename = asset.filename.lower()
        try:
            if content_type == "application/pdf" or filename.endswith(".pdf"):
                return RAGService._extract_pdf(asset.file_data)
            elif content_type in ["text/plain", "text/markdown"] or filename.endswith((".txt", ".md")):
                return asset.file_data.decode("utf-8", errors="ignore")
            elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or filename.endswith(".docx"):
                return RAGService._extract_docx(asset.file_data)
            elif content_type == "application/json" or filename.endswith(".json"):
                return asset.file_data.decode("utf-8", errors="ignore")
            else:
                try:
                    return asset.file_data.decode("utf-8", errors="ignore")
                except Exception:
                    return f"[Binary file: {asset.filename}]"
        except Exception as e:
            return f"[Error extracting content from {asset.filename}: {str(e)}]"
    
    @staticmethod
    async def build_context_from_assets(asset_ids: List[str], query: str = "", max_chars: int = 8000) -> str:
        """
        Build a combined context string from multiple assets.

        Uses a single batch DB query (no N+1). Falls back to full-context injection
        when the total content is small or FAISS is not available.
        """
        if not asset_ids:
            return ""

        # ⚡ One DB round-trip for all assets
        valid_ids = []
        for aid in asset_ids:
            try:
                valid_ids.append(bson.ObjectId(aid))
            except Exception:
                pass

        if not valid_ids:
            return ""

        assets = await UserAsset.find(In(UserAsset.id, valid_ids)).to_list()
        asset_map = {str(a.id): a for a in assets}

        contents: Dict[str, str] = {}
        for asset in assets:
            content = RAGService._extract_content_from_asset(asset)
            if content:
                contents[str(asset.id)] = content

        if not contents:
            return ""

        total_length = sum(len(c) for c in contents.values())
        if not HAS_FAISS or not query or total_length < 15000:
            # Full context injection (no vector search needed)
            context_parts = []
            chars_used = 0
            for asset_id, content in contents.items():
                asset = asset_map.get(asset_id)
                filename = asset.filename if asset else asset_id
                header = f"\n--- From: {filename} ---\n"
                remaining = max_chars - chars_used - len(header) - 100
                if remaining <= 0:
                    break
                if len(content) > remaining:
                    content = content[:remaining] + "... [truncated]"
                context_parts.append(header + content)
                chars_used += len(header) + len(content)
            return "\n".join(context_parts)

        # Semantic Search via FAISS + MPS hardware acceleration
        try:
            embeddings = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={"device": "mps"},
            )
            all_chunks: List[str] = []
            chunk_metadatas = []
            for asset_id, content in contents.items():
                filename = asset_map.get(asset_id, {}).filename if asset_map.get(asset_id) else "Unknown"
                chunks = RAGService.chunk_content(content)
                all_chunks.extend(chunks)
                chunk_metadatas.extend([{"source": filename}] * len(chunks))

            if not all_chunks:
                return ""

            vectorstore = FAISS.from_texts(all_chunks, embeddings, metadatas=chunk_metadatas)
            docs = vectorstore.similarity_search(query, k=5)
            context_parts = [
                f"\n--- From: {doc.metadata.get('source', 'Unknown')} ---\n{doc.page_content}"
                for doc in docs
            ]
            return "\n".join(context_parts)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"FAISS/MPS error in RAG: {e}")
            return ""
    
    @staticmethod
    def chunk_content(content: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Split content into overlapping chunks for better retrieval.
        
        This is useful for future semantic search implementation.
        """
        if len(content) <= chunk_size:
            return [content]
        
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + chunk_size
            
            # Try to break at a sentence boundary
            if end < len(content):
                # Look for sentence endings near the chunk boundary
                for delim in ['. ', '.\n', '\n\n', '\n']:
                    last_delim = content.rfind(delim, start + chunk_size - 200, end)
                    if last_delim != -1:
                        end = last_delim + len(delim)
                        break
            
            chunks.append(content[start:end].strip())
            start = end - overlap
        
        return chunks


# Singleton instance
rag_service = RAGService()
