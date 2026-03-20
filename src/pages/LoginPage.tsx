import { useState } from "react";
import { IconMessageCircle, IconSun, IconMoon } from "@tabler/icons-react";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/TemaContext";
import { useIdioma } from "../context/IdiomaContext";
import type { Idioma } from "../interfaces";

export function LoginPage() {
  const { login } = useAuth();
  const { tema, toggleTema } = useTema();
  const { t, idioma, cambiarIdioma } = useIdioma();

  const [modo, setModo] = useState<"login" | "registro">("login");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      let respuesta;
      if (modo === "login") {
        respuesta = await authApi.login({ telefono: telefono.trim() });
      } else {
        respuesta = await authApi.registro({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
        });
      }
      login(respuesta.access_token, respuesta.usuario_id, respuesta.nombre);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setCargando(false);
    }
  };

  return (
  <div
    className="min-h-screen flex flex-col items-center justify-center"
    style={{ 
      backgroundColor: "var(--color-bg-primary)",
      padding: "1.5rem" // ← Más espacio
    }}
  >
    {/* Controles superiores */}
    <div 
      className="fixed flex items-center gap-3"
      style={{
        top: "1.5rem",
        right: "1.5rem"
      }}
    >
      <select
        value={idioma}
        onChange={(e) => cambiarIdioma(e.target.value as Idioma)}
        className="outline-none cursor-pointer transition-all hover:opacity-80"
        style={{
          backgroundColor: "var(--color-bg-secondary)",
          color: "var(--color-text-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.75rem",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem"
        }}
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
      <button
        onClick={toggleTema}
        className="transition-all hover:opacity-80"
        style={{
          backgroundColor: "var(--color-bg-secondary)",
          color: "var(--color-text-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.75rem",
          padding: "0.625rem"
        }}
      >
        {tema === "light" ? <IconMoon size={18} /> : <IconSun size={18} />}
      </button>
    </div>

    {/* Contenedor principal */}
    <div
      className="w-full shadow-2xl"
      style={{ 
        backgroundColor: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "1.5rem",
        padding: "2.5rem", // ← MÁS PADDING INTERNO
        maxWidth: "28rem" // ← Contenedor más ancho
      }}
    >
      {/* Header */}
      <div 
        className="flex flex-col items-center"
        style={{ marginBottom: "2.5rem" }} // ← MÁS ESPACIO
      >
        <div
          className="flex items-center justify-center shadow-lg"
          style={{ 
            backgroundColor: "var(--color-accent)",
            width: "5rem", // ← ÍCONO MÁS GRANDE
            height: "5rem",
            borderRadius: "1.5rem",
            marginBottom: "1.5rem"
          }}
        >
          <IconMessageCircle size={48} color="#fff" strokeWidth={2} />
        </div>
        <h1
          className="font-bold"
          style={{ 
            color: "var(--color-text-primary)",
            fontSize: "1.75rem", // ← TÍTULO MÁS GRANDE
            marginBottom: "0.75rem"
          }}
        >
          {t.auth.welcome}
        </h1>
        <p
          className="text-center"
          style={{ 
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            maxWidth: "20rem"
          }}
        >
          {t.auth.subtitle}
        </p>
      </div>

      {/* Tabs de modo */}
      <div
        className="flex"
        style={{ 
          backgroundColor: "var(--color-bg-tertiary)",
          borderRadius: "1rem",
          padding: "0.375rem",
          marginBottom: "2rem" // ← MÁS ESPACIO
        }}
      >
        {(["login", "registro"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setModo(m);
              setError("");
            }}
            className="flex-1 font-semibold transition-all duration-200"
            style={{
              backgroundColor: modo === m ? "var(--color-accent)" : "transparent",
              color: modo === m ? "#fff" : "var(--color-text-secondary)",
              padding: "0.625rem",
              borderRadius: "0.75rem",
              fontSize: "0.875rem"
            }}
          >
            {m === "login" ? t.auth.login : t.auth.register}
          </button>
        ))}
      </div>

      {/* Formulario */}
      <form onSubmit={manejarSubmit}>
        {/* Campo nombre (solo registro) */}
        {modo === "registro" && (
          <div style={{ marginBottom: "1.5rem" }}> {/* ← MÁS ESPACIO ENTRE CAMPOS */}
            <label
              className="block font-medium"
              style={{ 
                color: "var(--color-text-secondary)",
                fontSize: "0.875rem",
                marginBottom: "0.5rem"
              }}
            >
              {t.auth.name}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t.auth.namePlaceholder}
              required
              minLength={2}
              className="w-full outline-none transition-all"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                padding: "0.875rem 1rem", // ← INPUT MÁS ALTO
                fontSize: "0.875rem"
              }}
            />
          </div>
        )}

        {/* Campo teléfono */}
        <div style={{ marginBottom: "1.5rem" }}> {/* ← MÁS ESPACIO ENTRE CAMPOS */}
          <label
            className="block font-medium"
            style={{ 
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "0.5rem"
            }}
          >
            {t.auth.phone}
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder={t.auth.phonePlaceholder}
            required
            minLength={7}
            className="w-full outline-none transition-all"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.75rem",
              padding: "0.875rem 1rem", // ← INPUT MÁS ALTO
              fontSize: "0.875rem"
            }}
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div
            className="flex items-start gap-2"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "0.75rem",
              padding: "0.875rem 1rem",
              fontSize: "0.875rem",
              marginBottom: "1.5rem"
            }}
          >
            <span style={{ fontWeight: "500" }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Botón de submit */}
        <button
          type="submit"
          disabled={cargando}
          className="w-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ 
            backgroundColor: "var(--color-accent)", 
            color: "#fff",
            borderRadius: "0.75rem",
            padding: "0.875rem", // ← BOTÓN MÁS ALTO
            fontSize: "0.875rem",
            marginTop: "0.5rem",
            boxShadow: cargando ? "none" : "0 4px 12px rgba(59, 130, 246, 0.3)",
            border: "none",
            cursor: cargando ? "not-allowed" : "pointer"
          }}
        >
          {cargando
            ? t.common.loading
            : modo === "login"
              ? t.auth.loginBtn
              : t.auth.registerBtn}
        </button>
      </form>

      {/* Cambiar modo */}
      <div 
        style={{ 
          marginTop: "2rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-border)"
        }}
      >
        <p
          className="text-center"
          style={{ 
            color: "var(--color-text-muted)",
            fontSize: "0.875rem"
          }}
        >
          {modo === "login" ? t.auth.noAccount : t.auth.hasAccount}{" "}
          <button
            onClick={() => {
              setModo(modo === "login" ? "registro" : "login");
              setError("");
            }}
            className="font-semibold hover:underline transition-all"
            style={{ 
              color: "var(--color-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0
            }}
          >
            {modo === "login" ? t.auth.register : t.auth.login}
          </button>
        </p>
      </div>
    </div>
  </div>
);
}
