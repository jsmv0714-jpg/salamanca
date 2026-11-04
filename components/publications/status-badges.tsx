import Badge, { type BadgeTone } from "../ui/badge";
import {
  APPLICATION_STATUS_LABELS,
  PUBLICATION_STATUS_LABELS,
  isApplicationStatus,
  isPublicationStatus,
  type ApplicationStatus,
  type PublicationStatus,
} from "../../lib/publications";

const PUBLICATION_TONES: Record<PublicationStatus, BadgeTone> = {
  draft: "neutral",
  in_review: "amber",
  published: "green",
  closed: "neutral",
  rejected: "danger",
};

const APPLICATION_TONES: Record<ApplicationStatus, BadgeTone> = {
  sent: "blue",
  viewed: "neutral",
  shortlisted: "amber",
  accepted: "green",
  rejected: "danger",
  withdrawn: "neutral",
};

export function PublicationStatusBadge({ status }: { status: string }) {
  if (!isPublicationStatus(status)) return <Badge>{status}</Badge>;
  return <Badge tone={PUBLICATION_TONES[status]}>{PUBLICATION_STATUS_LABELS[status]}</Badge>;
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  if (!isApplicationStatus(status)) return <Badge>{status}</Badge>;
  return <Badge tone={APPLICATION_TONES[status]}>{APPLICATION_STATUS_LABELS[status]}</Badge>;
}
