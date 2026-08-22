"use client";

interface AdminUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AdminRoleManagerProps {
  userIsAdmin: boolean;
  usersList: AdminUser[];
  onUpdateUserRole: (userId: string, newRole: string) => void;
}

export const AdminRoleManager = ({
  userIsAdmin,
  usersList,
  onUpdateUserRole,
}: AdminRoleManagerProps) => {
  if (!userIsAdmin) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "800px",
        gap: "12px",
        marginTop: "16px",
      }}
    >
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 900,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          margin: 0,
        }}
      >
        🛡️ GESTIÓN DE ROLES Y USUARIOS
      </h3>

      <div
        className="neo-card"
        style={{
          backgroundColor: "white",
          padding: "14px",
          boxShadow: "5px 5px 0px var(--primary)",
          border: "3px solid var(--primary)",
          maxHeight: "320px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {usersList.length === 0 ? (
          <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: 0 }}>
            Cargando lista de usuarios de Supabase...
          </p>
        ) : (
          usersList.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                border: "2px solid var(--primary)",
                backgroundColor: "var(--surface-container)",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  minWidth: "180px",
                }}
              >
                <img
                  src={
                    user.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/png?seed=${user.username}`
                  }
                  alt={user.username || "Usuario"}
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "cover",
                    border: "2px solid var(--primary)",
                    borderRadius: "50%",
                    backgroundColor: "white",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <h4
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    {user.full_name || user.username || "Usuario"}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.58rem",
                      opacity: 0.7,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    ID: {user.id}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label style={{ fontSize: "0.62rem", fontWeight: "bold" }}>ROL:</label>
                <select
                  value={user.role}
                  onChange={(e) => onUpdateUserRole(user.id, e.target.value)}
                  style={{
                    padding: "3px 6px",
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    border: "2px solid var(--primary)",
                    outline: "none",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  {["OYENTE", "VIP", "MODERADOR", "STREAMER", "ADMIN"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
