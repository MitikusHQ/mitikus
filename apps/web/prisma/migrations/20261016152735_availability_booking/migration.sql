-- Migration: availability_booking
-- Safe: only adds new enums, tables, columns, and indexes.
-- No data loss. Existing calendar_events get visibility = 'BUSY' (the default).

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PRIVATE', 'BUSY', 'TITLE', 'TEAM');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('ORGANIZER', 'ATTENDEE');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW');

-- AlterTable: add visibility column with safe default BUSY
ALTER TABLE "calendar_events" ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'BUSY';

-- CreateTable
CREATE TABLE "calendar_event_participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "role" "ParticipantRole" NOT NULL DEFAULT 'ATTENDEE',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "workDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "workStart" TEXT NOT NULL DEFAULT '09:00',
    "workEnd" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "minNotice" INTEGER NOT NULL DEFAULT 60,
    "maxHorizon" INTEGER NOT NULL DEFAULT 30,
    "publicEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_pages" (
    "id" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "eventId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestNote" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancelToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_event_participants_eventId_idx" ON "calendar_event_participants"("eventId");
CREATE INDEX "calendar_event_participants_userId_idx" ON "calendar_event_participants"("userId");
CREATE INDEX "availability_settings_workspaceId_idx" ON "availability_settings"("workspaceId");
CREATE UNIQUE INDEX "availability_settings_userId_workspaceId_key" ON "availability_settings"("userId", "workspaceId");
CREATE UNIQUE INDEX "booking_pages_availabilityId_key" ON "booking_pages"("availabilityId");
CREATE UNIQUE INDEX "booking_pages_token_key" ON "booking_pages"("token");
CREATE INDEX "booking_pages_token_idx" ON "booking_pages"("token");
CREATE UNIQUE INDEX "booking_requests_eventId_key" ON "booking_requests"("eventId");
CREATE UNIQUE INDEX "booking_requests_cancelToken_key" ON "booking_requests"("cancelToken");
CREATE INDEX "booking_requests_bookingPageId_idx" ON "booking_requests"("bookingPageId");
CREATE INDEX "booking_requests_bookingPageId_startsAt_idx" ON "booking_requests"("bookingPageId", "startsAt");

-- AddForeignKey
--
-- Política de retención de reservas (aprobada):
--
--   calendar_event_participants → events: CASCADE (los participantes no tienen sentido sin el evento)
--   calendar_event_participants → users:  SET NULL (el guest externo sobrevive si se borra el usuario interno)
--
--   availability_settings → users:      RESTRICT  — el borrado de usuario/workspace debe ser explícito
--   availability_settings → workspaces: RESTRICT    y transaccional; nunca en cascada automática.
--   booking_pages → availability_settings: RESTRICT — no se puede borrar config con página activa.
--   booking_requests → booking_pages:    RESTRICT  — las reservas históricas son inmutables desde UI.
--
--   booking_requests → calendar_events: SET NULL (la reserva sobrevive aunque se cancele el evento)
--
-- Para eliminar un usuario o workspace que tenga disponibilidad configurada, usar la acción
-- administrativa `deleteAvailabilityData` (availability.ts) que ejecuta el borrado en el orden
-- correcto: BookingRequest → BookingPage → AvailabilitySettings → usuario/workspace.

ALTER TABLE "calendar_event_participants" ADD CONSTRAINT "calendar_event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_event_participants" ADD CONSTRAINT "calendar_event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "availability_settings" ADD CONSTRAINT "availability_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "availability_settings" ADD CONSTRAINT "availability_settings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_pages_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "availability_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "booking_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
