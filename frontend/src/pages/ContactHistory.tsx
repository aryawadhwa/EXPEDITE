import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Mail, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function ContactHistory() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState<any>(null);
    const api = useApi();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [contactsData, statsData] = await Promise.all([
                api.getContactHistory(),
                api.getContactStats()
            ]);
            setContacts(contactsData || []);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch contact history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.prospect_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.prospect_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToCSV = () => {
        const headers = ["Email", "Name", "First Contacted", "Last Contacted", "Total Emails", "Status"];
        const rows = filteredContacts.map(c => [
            c.prospect_email,
            c.prospect_name || "",
            format(new Date(c.first_contacted_at), "yyyy-MM-dd HH:mm"),
            format(new Date(c.last_contacted_at), "yyyy-MM-dd HH:mm"),
            c.total_emails_sent,
            c.status
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contact-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
    };

    return (
        <div className="h-full p-6 lg:p-8 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Contact History</h1>
                    <p className="text-muted-foreground mt-1">Track all email communications and prevent duplicates</p>
                </div>
                <Button onClick={exportToCSV} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-card border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats.total_contacts}</p>
                                <p className="text-xs text-muted-foreground">Total Contacts</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-card border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats.replied_contacts}</p>
                                <p className="text-xs text-muted-foreground">Replied</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-card border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats.reply_rate.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Reply Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by email or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">First Contacted</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Contacted</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Emails Sent</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        {searchQuery ? "No contacts found" : "No contact history yet"}
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-sm font-mono text-foreground">{contact.prospect_email}</td>
                                        <td className="p-4 text-sm text-foreground">{contact.prospect_name || "-"}</td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {format(new Date(contact.first_contacted_at), "MMM d, yyyy HH:mm")}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {format(new Date(contact.last_contacted_at), "MMM d, yyyy HH:mm")}
                                        </td>
                                        <td className="p-4 text-sm text-foreground">
                                            <Badge variant="secondary">{contact.total_emails_sent}</Badge>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <Badge
                                                variant={contact.has_replied ? "default" : "secondary"}
                                                className={contact.has_replied ? "bg-green-500" : ""}
                                            >
                                                {contact.has_replied ? "Replied" : "No Reply"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
