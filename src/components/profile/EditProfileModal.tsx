"use client";

import { useState } from "react";
import { NeoModal } from "../common/NeoModal";
import { UserProfile } from "@/types";
import { getRoleBadgeInfo } from "@/lib/permissions";

interface EditProfileModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (name: string, bio: string) => Promise<void>;
}

interface EditProfileFormProps {
  userProfile: UserProfile;
  onSave: (name: string, bio: string) => Promise<void>;
}

const EditProfileForm = ({ userProfile, onSave }: EditProfileFormProps) => {
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  const badge = getRoleBadgeInfo(userProfile.role);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(name, bio);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Badge de Rol */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
        <span
          style={{
            backgroundColor: badge.bg,
            color: badge.color,
            border: `2px solid ${badge.border}`,
            padding: "4px 10px",
            fontSize: "0.75rem",
            fontWeight: 900,
            boxShadow: "2px 2px 0px var(--primary)",
          }}
        >
          {badge.badge}
        </span>
      </div>

      <div>
        <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          NOMBRE / ALIAS:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "7px 10px",
            border: "2.5px solid var(--primary)",
            outline: "none",
            fontSize: "0.8rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: "0.7rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
          ESTADO PERSONAL / BIOGRAFÍA:
        </label>
        <input
          type="text"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Ej: Amante del vinilo, rock 90s y cumbia clásica"
          style={{
            width: "100%",
            padding: "7px 10px",
            border: "2.5px solid var(--primary)",
            outline: "none",
            fontSize: "0.8rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className="neo-button fun-hover-wobble"
        style={{
          backgroundColor: isSaving ? "var(--surface-container)" : "var(--primary-container)",
          width: "100%",
          padding: "10px",
          fontSize: "0.75rem",
          fontWeight: 900,
          marginTop: "6px",
          cursor: isSaving ? "not-allowed" : "pointer",
          boxShadow: "3px 3px 0px var(--primary)",
        }}
      >
        {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
      </button>
    </div>
  );
};

export const EditProfileModal = ({
  isOpen,
  userProfile,
  onClose,
  onSave,
}: EditProfileModalProps) => {
  if (!isOpen) return null;

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      title="EDITAR PERFIL"
      badgeText="RADIO DOBLE C 📻"
      maxWidth="380px"
    >
      <EditProfileForm
        key={`${userProfile.name}-${userProfile.bio}`}
        userProfile={userProfile}
        onSave={onSave}
      />
    </NeoModal>
  );
};
