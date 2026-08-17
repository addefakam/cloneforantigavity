"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import {
  apiGetGroupBookings,
  apiCreateGroupBooking,
  apiUpdateGroupBooking,
  apiDeleteGroupBooking,
  apiGetReservations,
  apiGetRooms,
  apiGetGuests,
  apiCreateReservation,
} from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Phone,
  Mail,
  Building2,
} from "lucide-react";

interface GroupBooking {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
 roomCount: number;
  guestCount: number;
  totalCost: number;
  reservations?: Reservation[];
  createdAt: string;
}

interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  guest?: { id: string; name: string; phone: string };
  room?: { id: string; number: string; name: string; type: string };
}

interface GuestOption {
  id: string;
  name: string;
  phone: string;
}

interface RoomOption {
  id: string;
  number: string;
  name: string;
  type: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const RESERVATION_STATUS_BADGE: Record<string, string> = {
  UPCOMING: "bg-sky-100 text-sky-800 border-sky-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-gray-100 text-gray-700 border-gray-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};

const GROUP_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default function GroupBookingsPage() {
  const { refreshKey } = useAppStore();

  const [groupBookings, setGroupBookings] = useState<GroupBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addReservationOpen, setAddReservationOpen] = useState(false);
  const [addReservationGroupId, setAddReservationGroupId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupBooking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingReservation, setAddingReservation] = useState(false);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const [resGuestId, setResGuestId] = useState("");
  const [resRoomId, setResRoomId] = useState("");
  const [resCheckIn, setResCheckIn] = useState("");
  const [resCheckOut, setResCheckOut] = useState("");

  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  const fetchGroupBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGetGroupBookings(`page=${page}&limit=10`);
      setGroupBookings(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch {
      toast.error("Failed to load group bookings");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchGuests = useCallback(async () => {
    try {
      const data = await apiGetGuests("");
      setGuests(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await apiGetRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchGroupBookings();
  }, [fetchGroupBookings, refreshKey]);

  useEffect(() => {
    if (createOpen || addReservationOpen) {
      fetchGuests();
      fetchRooms();
    }
  }, [createOpen, addReservationOpen, fetchGuests, fetchRooms]);

  const resetCreateForm = () => {
    setName("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  const resetReservationForm = () => {
    setResGuestId("");
    setResRoomId("");
    setResCheckIn("");
    setResCheckOut("");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    try {
      setCreating(true);
      await apiCreateGroupBooking({
        name: name.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        startDate,
        endDate,
        notes: notes.trim(),
      });
      toast.success("Group booking created successfully");
      setCreateOpen(false);
      resetCreateForm();
      fetchGroupBookings();
    } catch {
      toast.error("Failed to create group booking");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiUpdateGroupBooking(id, { status });
      toast.success(`Status updated to ${status}`);
      fetchGroupBookings();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await apiDeleteGroupBooking(deleteTarget.id);
      toast.success("Group booking deleted");
      setDeleteTarget(null);
      if (detailId === deleteTarget.id) setDetailId(null);
      fetchGroupBookings();
    } catch {
      toast.error("Failed to delete group booking");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddReservation = async () => {
    if (!addReservationGroupId || !resGuestId || !resRoomId) {
      toast.error("Please select a guest and room");
      return;
    }
    if (!resCheckIn || !resCheckOut) {
      toast.error("Check-in and check-out dates are required");
      return;
    }
    try {
      setAddingReservation(true);
      await apiCreateReservation({
        guestId: resGuestId,
        roomId: resRoomId,
        checkIn: resCheckIn,
        checkOut: resCheckOut,
        groupBookingId: addReservationGroupId,
      });
      toast.success("Reservation added to group");
      setAddReservationOpen(false);
      resetReservationForm();
      setAddReservationGroupId(null);
      fetchGroupBookings();
    } catch {
      toast.error("Failed to add reservation");
    } finally {
      setAddingReservation(false);
    }
  };

  const openAddReservation = (group: GroupBooking) => {
    setAddReservationGroupId(group.id);
    setResCheckIn(group.startDate);
    setResCheckOut(group.endDate);
    setAddReservationOpen(true);
  };

  const toggleDetail = (id: string) => {
    setDetailId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE");

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Group Bookings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage teams, events, and bulk reservations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Group Booking
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-4 w-3/4 max-w-sm" />
                  <Skeleton className="h-4 w-1/2 max-w-xs" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && groupBookings.length === 0 && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No group bookings yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first group booking to get started.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group Booking
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Group Booking List */}
      {!loading && groupBookings.length > 0 && (
        <div className="space-y-4">
          {groupBookings.map((group) => {
            const isExpanded = detailId === group.id;
            const badgeClass = STATUS_COLORS[group.status] ?? "bg-gray-100 text-gray-700 border-gray-200";

            return (
              <Card key={group.id} className="overflow-hidden">
                {/* Card Header */}
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <CardTitle className="text-base font-semibold truncate">
                        {group.name}
                      </CardTitle>
                      <Badge variant="outline" className={badgeClass}>
                        {group.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select
                        value={group.status}
                        onValueChange={(value) =>
                          handleStatusChange(group.id, value)
                        }
                      >
                        <SelectTrigger className="w-[150px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GROUP_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddReservation(group)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Reservation</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(group)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetail(group.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Card Body */}
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {group.contactName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{group.contactName}</span>
                      </div>
                    )}
                    {group.contactPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{group.contactPhone}</span>
                      </div>
                    )}
                    {group.contactEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{group.contactEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {formatDate(group.startDate)} — {formatDate(group.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-5 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{group.roomCount ?? 0} rooms</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{group.guestCount ?? 0} guests</span>
                    </div>
                    {(group.totalCost ?? 0) > 0 && (
                      <span className="font-medium text-foreground">
                        {group.totalCost?.toLocaleString()} ETB
                      </span>
                    )}
                  </div>

                  {group.notes && (
                    <p className="mt-3 text-sm text-muted-foreground border-l-2 border-muted pl-3">
                      {group.notes}
                    </p>
                  )}

                  {/* Expanded: Linked Reservations */}
                  {isExpanded && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      {group.reservations && group.reservations.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Guest</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead className="hidden md:table-cell">Check-in</TableHead>
                              <TableHead className="hidden md:table-cell">Check-out</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.reservations.map((res) => (
                              <TableRow key={res.id}>
                                <TableCell className="font-medium">
                                  {res.guest?.name ?? "—"}
                                </TableCell>
                                <TableCell>
                                  {res.room
                                    ? `${res.room.number}${res.room.name ? ` — ${res.room.name}` : ""}`
                                    : "—"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {formatDate(res.checkIn)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {formatDate(res.checkOut)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      RESERVATION_STATUS_BADGE[res.status] ??
                                      "bg-gray-100 text-gray-700 border-gray-200"
                                    }
                                  >
                                    {res.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No reservations linked to this group yet.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Group Booking Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) resetCreateForm();
        setCreateOpen(open);
      }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Group Booking</DialogTitle>
            <DialogDescription>
              Add a new group booking for a team or event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="group-name">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="group-name"
                placeholder="e.g. ABC Company Training"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  placeholder="Full name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  placeholder="Phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="email@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Group Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reservation to Group Dialog */}
      <Dialog
        open={addReservationOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetReservationForm();
            setAddReservationGroupId(null);
          }
          setAddReservationOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Reservation to Group</DialogTitle>
            <DialogDescription>
              Link a new reservation to this group booking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="res-guest">Guest <span className="text-destructive">*</span></Label>
              <Select value={resGuestId} onValueChange={setResGuestId}>
                <SelectTrigger id="res-guest">
                  <SelectValue placeholder="Select a guest" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}{g.phone ? ` — ${g.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-room">Room <span className="text-destructive">*</span></Label>
              <Select value={resRoomId} onValueChange={setResRoomId}>
                <SelectTrigger id="res-room">
                  <SelectValue placeholder="Select an available room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.number}{r.name ? ` — ${r.name}` : ""}
                      {r.type ? ` (${r.type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="res-checkin">Check-in Date</Label>
                <Input
                  id="res-checkin"
                  type="date"
                  value={resCheckIn}
                  onChange={(e) => setResCheckIn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="res-checkout">Check-out Date</Label>
                <Input
                  id="res-checkout"
                  type="date"
                  value={resCheckOut}
                  onChange={(e) => setResCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddReservationOpen(false);
                resetReservationForm();
                setAddReservationGroupId(null);
              }}
              disabled={addingReservation}
            >
              Cancel
            </Button>
            <Button onClick={handleAddReservation} disabled={addingReservation}>
              {addingReservation ? "Adding..." : "Add Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? This action
              cannot be undone and may affect all linked reservations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
