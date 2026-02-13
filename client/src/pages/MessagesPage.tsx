import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MessageSquarePlus, Send, ArrowLeft, Users, UsersRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSearch } from "wouter";
import type { GroupWithMemberCount } from "@shared/schema";

type Participant = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  profileImageUrl: string | null;
};

type ConversationSummary = {
  id: number;
  isGroup: boolean;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  participants: Participant[];
  lastMessage: {
    id: number;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
};

type MessageWithSender = {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

function getConversationName(conv: ConversationSummary, currentUserId: string): string {
  if (conv.title) return conv.title;
  const others = conv.participants.filter(p => p.id !== currentUserId);
  if (others.length === 0) return "Just you";
  return others.map(p => {
    const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    return name || "Unknown";
  }).join(", ");
}

function getUserName(user: { firstName: string | null; lastName: string | null }): string {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Unknown";
}

function getInitials(user: { firstName: string | null; lastName: string | null }): string {
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`;
  return (user.firstName || user.lastName || "U").substring(0, 2).toUpperCase();
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchStr = useSearch();
  const urlParams = new URLSearchParams(searchStr);
  const convFromUrl = urlParams.get("conv");

  const [selectedConvId, setSelectedConvId] = useState<number | null>(convFromUrl ? Number(convFromUrl) : null);
  const [messageInput, setMessageInput] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [newConvMode, setNewConvMode] = useState<"contacts" | "group">("contacts");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = user?.id || "";

  const { data: convs = [], isLoading: convsLoading } = useQuery<ConversationSummary[]>({
    queryKey: ["/api/messages/conversations"],
    refetchInterval: 10000,
  });

  const { data: coachConnections = [] } = useQuery<any[]>({
    queryKey: ["/api/coach/athletes"],
    enabled: user?.role === "COACH",
  });

  const { data: athleteCoaches = [] } = useQuery<any[]>({
    queryKey: ["/api/athlete/coaches"],
    enabled: user?.role === "ATHLETE",
  });

  const { data: coachGroups = [] } = useQuery<GroupWithMemberCount[]>({
    queryKey: ["/api/coach/groups"],
    enabled: user?.role === "COACH",
  });

  const { data: msgs = [], isLoading: msgsLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages/conversations", selectedConvId, "messages"],
    enabled: !!selectedConvId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => apiPost(`/api/messages/conversations/${selectedConvId}/messages`, { content: messageInput }),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", selectedConvId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createConvMutation = useMutation({
    mutationFn: () => {
      if (newConvMode === "group" && selectedGroupId) {
        return apiPost("/api/messages/conversations", { groupId: Number(selectedGroupId) });
      }
      return apiPost("/api/messages/conversations", {
        participantIds: selectedParticipants,
        isGroup: selectedParticipants.length > 1,
        title: selectedParticipants.length > 1 ? groupTitle || undefined : undefined,
      });
    },
    onSuccess: (data: any) => {
      setShowNewDialog(false);
      setSelectedParticipants([]);
      setGroupTitle("");
      setSelectedGroupId("");
      setNewConvMode("contacts");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setSelectedConvId(data.id);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;
    sendMutation.mutate();
  };

  const contactList = user?.role === "COACH"
    ? coachConnections.map((c: any) => c.athlete || c)
    : athleteCoaches;

  const selectedConv = convs.find(c => c.id === selectedConvId);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        <div className={cn(
          "flex flex-col border rounded-md w-80 shrink-0 bg-card",
          selectedConvId ? "hidden md:flex" : "flex flex-1 md:flex-none md:w-80"
        )}>
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <h2 className="font-semibold text-lg" data-testid="text-messages-title">Messages</h2>
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-new-conversation">
                  <MessageSquarePlus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {user?.role === "COACH" && coachGroups.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newConvMode === "contacts" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setNewConvMode("contacts"); setSelectedGroupId(""); }}
                        data-testid="button-conv-mode-contacts"
                      >
                        <Users className="w-4 h-4" />
                        Contacts
                      </Button>
                      <Button
                        type="button"
                        variant={newConvMode === "group" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setNewConvMode("group"); setSelectedParticipants([]); }}
                        data-testid="button-conv-mode-group"
                      >
                        <UsersRound className="w-4 h-4" />
                        From Group
                      </Button>
                    </div>
                  )}

                  {newConvMode === "group" ? (
                    <>
                      <div className="space-y-2">
                        <Label>Select a Group</Label>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {coachGroups.filter(g => g.memberCount > 0).map((g) => (
                            <div
                              key={g.id}
                              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                                selectedGroupId === String(g.id) ? "bg-primary/10 border border-primary/30" : "hover-elevate"
                              }`}
                              onClick={() => setSelectedGroupId(String(g.id))}
                              data-testid={`group-option-${g.id}`}
                            >
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                <UsersRound className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{g.name}</p>
                                <p className="text-xs text-muted-foreground">{g.memberCount} athletes</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {coachGroups.filter(g => g.memberCount > 0).length === 0 && (
                          <p className="text-sm text-muted-foreground">No groups with members yet.</p>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        disabled={!selectedGroupId || createConvMutation.isPending}
                        onClick={() => createConvMutation.mutate()}
                        data-testid="button-create-group-conversation"
                      >
                        {createConvMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UsersRound className="w-4 h-4" />}
                        Start Group Chat
                      </Button>
                    </>
                  ) : contactList.length === 0 ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-no-contacts">
                      {user?.role === "COACH"
                        ? "Connect with athletes first from My Athletes page."
                        : "No connected coaches found."}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {contactList.map((contact: any) => {
                          const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown';
                          const checked = selectedParticipants.includes(contact.id);
                          return (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate"
                              data-testid={`contact-${contact.id}`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(val) => {
                                  if (val) {
                                    setSelectedParticipants(prev => [...prev, contact.id]);
                                  } else {
                                    setSelectedParticipants(prev => prev.filter(id => id !== contact.id));
                                  }
                                }}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={contact.profileImageUrl || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10">{getInitials(contact)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{name}</span>
                              <Badge variant="outline" className="ml-auto text-xs no-default-active-elevate">{contact.role}</Badge>
                            </label>
                          );
                        })}
                      </div>

                      {selectedParticipants.length > 1 && (
                        <div>
                          <Label htmlFor="group-title">Group Name (optional)</Label>
                          <Input
                            id="group-title"
                            placeholder="e.g. Sprint Team"
                            value={groupTitle}
                            onChange={(e) => setGroupTitle(e.target.value)}
                            className="mt-1.5"
                            data-testid="input-group-title"
                          />
                        </div>
                      )}

                      <Button
                        className="w-full"
                        disabled={selectedParticipants.length === 0 || createConvMutation.isPending}
                        onClick={() => createConvMutation.mutate()}
                        data-testid="button-create-conversation"
                      >
                        {createConvMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                        Start Conversation
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : convs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground px-4" data-testid="text-no-conversations">
                <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No conversations yet.
              </div>
            ) : (
              convs.map((conv) => {
                const name = getConversationName(conv, userId);
                const isActive = conv.id === selectedConvId;
                const preview = conv.lastMessage?.content || "No messages yet";
                const timeStr = conv.lastMessage?.createdAt
                  ? format(new Date(conv.lastMessage.createdAt), "MMM d, HH:mm")
                  : "";

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={cn(
                      "p-3 cursor-pointer border-b transition-colors",
                      isActive ? "bg-primary/10" : "hover-elevate"
                    )}
                    data-testid={`conversation-item-${conv.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{name}</p>
                          {conv.isGroup && <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
                      </div>
                      {timeStr && (
                        <span className="text-xs text-muted-foreground shrink-0">{timeStr}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={cn(
          "flex flex-col flex-1 border rounded-md bg-card",
          !selectedConvId ? "hidden md:flex" : "flex"
        )}>
          {!selectedConvId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground" data-testid="text-select-conversation">
              <div className="text-center">
                <MessageSquarePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation or start a new one</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setSelectedConvId(null)}
                  data-testid="button-back-conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" data-testid="text-conversation-name">
                    {selectedConv ? getConversationName(selectedConv, userId) : ""}
                  </p>
                  {selectedConv?.isGroup && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.participants.length} members
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : msgs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground" data-testid="text-no-messages">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  msgs.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
                        data-testid={`message-${msg.id}`}
                      >
                        {!isMe && (
                          <Avatar className="h-7 w-7 shrink-0 mt-1">
                            <AvatarFallback className="text-xs bg-primary/10">{getInitials(msg.sender)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "max-w-[70%] rounded-md px-3 py-2",
                          isMe ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}>
                          {!isMe && selectedConv?.isGroup && (
                            <p className="text-xs font-medium mb-0.5 opacity-70">{getUserName(msg.sender)}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  data-testid="button-send-message"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
