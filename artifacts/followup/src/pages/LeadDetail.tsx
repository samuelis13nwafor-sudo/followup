import { useParams, useLocation } from "wouter";
import { useLeads } from "../hooks/useLeads";
import { StatusBadge } from "../components/StatusBadge";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Trash2, Calendar, Phone, Mail, CheckCircle2, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getLead, updateLead, deleteLead, isLoaded } = useLeads();
  const { toast } = useToast();
  
  const lead = getLead(id || "");
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState("");

  useEffect(() => {
    if (lead) {
      setNotesValue(lead.notes);
      setDateValue(lead.followUpDate);
    }
  }, [lead]);

  if (!isLoaded) return null;
  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead not found.</div>;

  const handleStatusChange = (status: "Contacted" | "Quote Sent" | "Won" | "Lost") => {
    updateLead(lead.id, { status });
    toast({
      title: "Status updated",
      description: `Lead status changed to ${status}.`,
    });
  };

  const handleSaveNotes = () => {
    updateLead(lead.id, { notes: notesValue });
    setIsEditingNotes(false);
    toast({ title: "Notes saved." });
  };

  const handleSaveDate = () => {
    updateLead(lead.id, { followUpDate: dateValue });
    setIsEditingDate(false);
    toast({ title: "Follow-up date updated." });
  };

  const handleDelete = () => {
    deleteLead(lead.id);
    toast({ title: "Lead deleted." });
    setLocation("/leads");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/leads')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
          <p className="text-muted-foreground font-medium mt-1">{lead.service}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.status as any} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-6 border-b">
        {lead.status !== "Contacted" && lead.status !== "Won" && lead.status !== "Lost" && (
          <Button variant="outline" className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200" onClick={() => handleStatusChange("Contacted")}>
            Mark Contacted
          </Button>
        )}
        {lead.status !== "Won" && lead.status !== "Lost" && (
          <Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-800 border-green-200" onClick={() => handleStatusChange("Won")}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark Won
          </Button>
        )}
        {lead.status !== "Lost" && lead.status !== "Won" && (
          <Button variant="outline" className="bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200" onClick={() => handleStatusChange("Lost")}>
            <XCircle className="mr-2 h-4 w-4" />
            Mark Lost
          </Button>
        )}
        <div className="flex-1" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the lead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Source</div>
                <div className="text-sm">{lead.source}</div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created</div>
                <div className="text-sm">{format(parseISO(lead.createdAt), 'MMM d, yyyy')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Follow-up Date</CardTitle>
              {!isEditingDate && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingDate(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingDate ? (
                <div className="space-y-3 flex flex-col">
                  <Input 
                    type="date" 
                    value={dateValue} 
                    onChange={(e) => setDateValue(e.target.value)} 
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDate(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveDate}>Save</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{format(parseISO(lead.followUpDate), 'MMM d, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="h-full flex flex-col min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Notes</CardTitle>
              {!isEditingNotes && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingNotes(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isEditingNotes ? (
                <div className="space-y-4 flex-1 flex flex-col">
                  <Textarea 
                    className="flex-1 min-h-[250px] resize-none" 
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add details about this lead..."
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" onClick={() => setIsEditingNotes(false)}>Cancel</Button>
                    <Button onClick={handleSaveNotes}>Save Notes</Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/20 rounded-md border border-dashed">
                  {lead.notes ? lead.notes : <span className="text-muted-foreground italic">No notes yet.</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
