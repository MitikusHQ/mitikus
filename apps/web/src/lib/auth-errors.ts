const CLERK_ERROR_MAP: Record<string, string> = {
  form_password_incorrect: 'Contraseña incorrecta.',
  form_identifier_not_found: 'No hay ninguna cuenta con este email.',
  form_identifier_exists: 'Ya existe una cuenta con este email.',
  form_password_pwned:
    'Esta contraseña apareció en una filtración de datos. Elige otra distinta.',
  form_password_too_short: 'La contraseña debe tener al menos 8 caracteres.',
  form_password_not_strong_enough:
    'La contraseña es demasiado débil. Usa una combinación de letras, números y símbolos.',
  form_password_size_in_bytes_exceeded: 'La contraseña es demasiado larga.',
  form_code_incorrect: 'Código de verificación incorrecto. Inténtalo de nuevo.',
  form_code_expired: 'El código de verificación ha caducado. Solicita uno nuevo.',
  verification_expired: 'El enlace de verificación ha caducado. Solicita uno nuevo.',
  too_many_requests: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
  session_exists: 'Ya tienes una sesión activa.',
  not_allowed_access: 'Acceso no permitido. Contacta con soporte si esto es inesperado.',
  network_error: 'Error de red. Comprueba tu conexión e inténtalo de nuevo.',
}

export function mapClerkError(err: unknown): string {
  const clerkErr = err as {
    errors?: Array<{ code?: string; longMessage?: string; message?: string }>
  }
  const code = clerkErr.errors?.[0]?.code ?? ''
  if (code && CLERK_ERROR_MAP[code]) return CLERK_ERROR_MAP[code]
  const msg =
    clerkErr.errors?.[0]?.longMessage ?? clerkErr.errors?.[0]?.message
  return msg ?? 'Algo salió mal. Inténtalo de nuevo.'
}
