"""
GitHub profile ingestion service.

Fetches public repositories and selected README content, then converts
them into markdown knowledge assets for personalization and RAG context.
"""

from typing import Dict, List, Optional
import base64

import httpx


class GitHubIngestService:
    BASE_URL = "https://api.github.com"

    async def fetch_public_repositories(
        self,
        username: str,
        max_repos: int = 20,
        include_forks: bool = False,
    ) -> List[Dict]:
        """
        Return normalized public repository data for a GitHub user.
        """
        username = (username or "").strip()
        if not username:
            return []

        async with httpx.AsyncClient(timeout=20.0) as client:
            repos_resp = await client.get(
                f"{self.BASE_URL}/users/{username}/repos",
                params={"per_page": min(max_repos, 100), "sort": "updated"},
                headers={"Accept": "application/vnd.github+json"},
            )
            if repos_resp.status_code != 200:
                return []

            repos = repos_resp.json()
            if not isinstance(repos, list):
                return []

            normalized: List[Dict] = []
            for repo in repos:
                if not include_forks and repo.get("fork"):
                    continue
                normalized.append(
                    {
                        "name": repo.get("name", ""),
                        "full_name": repo.get("full_name", ""),
                        "description": repo.get("description") or "",
                        "html_url": repo.get("html_url", ""),
                        "clone_url": repo.get("clone_url", ""),
                        "language": repo.get("language") or "",
                        "topics": repo.get("topics") or [],
                        "stargazers_count": repo.get("stargazers_count", 0),
                        "forks_count": repo.get("forks_count", 0),
                        "created_at": repo.get("created_at", ""),
                        "updated_at": repo.get("updated_at", ""),
                        "default_branch": repo.get("default_branch") or "main",
                    }
                )
                if len(normalized) >= max_repos:
                    break

            return normalized

    async def fetch_repo_readme(self, owner: str, repo: str) -> Optional[str]:
        """
        Return decoded README markdown if available.
        """
        async with httpx.AsyncClient(timeout=20.0) as client:
            readme_resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/readme",
                headers={"Accept": "application/vnd.github+json"},
            )
            if readme_resp.status_code != 200:
                return None

            payload = readme_resp.json()
            content = payload.get("content")
            if not content:
                return None

            try:
                decoded = base64.b64decode(content).decode("utf-8", errors="ignore")
                return decoded
            except Exception:
                return None

    async def build_profile_markdown(
        self,
        username: str,
        max_repos: int = 20,
        include_readmes: bool = True,
        include_forks: bool = False,
    ) -> Dict:
        repos = await self.fetch_public_repositories(
            username=username, max_repos=max_repos, include_forks=include_forks
        )
        if not repos:
            return {"summary_markdown": "", "repos": []}

        lines: List[str] = [
            f"# GitHub Project Profile: {username}",
            "",
            "This file is auto-generated and used for personalization context.",
            "",
            f"Total imported repositories: {len(repos)}",
            "",
        ]

        enriched: List[Dict] = []
        for i, repo in enumerate(repos, 1):
            repo_lines = [
                f"## {i}. {repo.get('name')}",
                f"- URL: {repo.get('html_url')}",
                f"- Description: {repo.get('description') or 'N/A'}",
                f"- Language: {repo.get('language') or 'N/A'}",
                f"- Stars: {repo.get('stargazers_count', 0)}",
                f"- Forks: {repo.get('forks_count', 0)}",
                f"- Topics: {', '.join(repo.get('topics') or []) or 'N/A'}",
                "",
            ]

            readme = None
            if include_readmes and repo.get("full_name"):
                parts = repo["full_name"].split("/", 1)
                if len(parts) == 2:
                    readme = await self.fetch_repo_readme(parts[0], parts[1])
            if readme:
                trimmed = readme[:5000]
                repo_lines += [
                    "### README (trimmed)",
                    "```markdown",
                    trimmed,
                    "```",
                    "",
                ]
            repo["readme"] = readme or ""
            lines.extend(repo_lines)
            enriched.append(repo)

        return {"summary_markdown": "\n".join(lines), "repos": enriched}


github_ingest_service = GitHubIngestService()
