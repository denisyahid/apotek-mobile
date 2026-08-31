"use client";

import {
  BadgeCheck,
  Bell,
  CircleCheckBig,
  MessageCircleMore,
  Package,
  Pill,
} from "lucide-react";
import type { NotificationType } from "@/types";

export const notificationIcons: Record<NotificationType, typeof Bell> = {
  order: Package,
  payment: BadgeCheck,
  chat: MessageCircleMore,
  recommendation: Pill,
  system: CircleCheckBig,
};
