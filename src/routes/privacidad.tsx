import { createFileRoute, Link } from "@tanstack/react-router";

const privacyEmail = "deicylorenabahos@gmail.com";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Tratamiento de Datos · Academia Lorena Bahos" },
      {
        name: "description",
        content:
          "Conoce cómo MG Lorena Bahos Centro de Belleza Integral trata y protege tus datos personales.",
      },
      { property: "og:title", content: "Política de Tratamiento de Datos" },
      {
        property: "og:description",
        content:
          "Información sobre el tratamiento de datos personales de la Academia Lorena Bahos.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <p className="eyebrow">Academia Lorena Bahos</p>
      <h1 className="mt-4 text-5xl">Política de Tratamiento de Datos Personales</h1>
      <p className="mt-4 text-sm text-muted-foreground">Vigente desde el 26 de octubre de 2026</p>

      <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-2xl text-foreground">1. Responsable del tratamiento</h2>
          <p className="mt-3">
            El responsable es MG Lorena Bahos Centro de Belleza Integral, con domicilio en Av. San
            Francisco, Edificio Fénix, piso 2, Mocoa, Putumayo, Colombia. Puedes presentar consultas
            y reclamos sobre tus datos en{" "}
            <a className="text-foreground underline" href={`mailto:${privacyEmail}`}>
              {privacyEmail}
            </a>{" "}
            o llamando al +57 323 729 8148.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">2. Datos que tratamos</h2>
          <p className="mt-3">
            Según las funciones que uses, podemos tratar tu nombre, correo electrónico, imagen de
            perfil e identificador de cuenta obtenidos al iniciar sesión con Google; el curso
            adquirido, fecha de inscripción, valor e identificador de la transacción informado por
            Mercado Pago; avance en lecciones, resultados de evaluaciones y datos necesarios para
            emitir certificados. También conservamos la versión y fecha de la autorización de
            tratamiento que otorgas al iniciar sesión.
          </p>
          <p className="mt-3">
            La plataforma no recibe ni almacena el número completo de tu tarjeta ni el código de
            seguridad: esos datos los gestiona Mercado Pago. No solicitamos datos sensibles para
            acceder a los cursos; evita incluirlos en comunicaciones de soporte.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">3. Finalidades</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Crear y proteger tu cuenta, autenticarte y atender solicitudes de soporte.</li>
            <li>Procesar inscripciones y pagos, validar transacciones y habilitar los cursos.</li>
            <li>Guardar el avance, gestionar evaluaciones y emitir certificados.</li>
            <li>Prevenir fraude, mantener la seguridad y resolver incidentes técnicos.</li>
            <li>Cumplir obligaciones legales, contables y atender requerimientos de autoridad.</li>
          </ul>
          <p className="mt-3">
            No usamos actualmente herramientas de analítica publicitaria ni píxeles de seguimiento.
            Si se incorporan, se actualizará esta política y se solicitará la autorización que
            corresponda antes de activarlos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">4. Proveedores y circulación</h2>
          <p className="mt-3">
            Para prestar el servicio utilizamos Google para el inicio de sesión; Supabase para
            autenticación y almacenamiento de la cuenta y actividad académica; Mercado Pago para
            procesar pagos; Netlify para alojamiento y entrega de la aplicación; y Google Fonts para
            cargar tipografías. Estos proveedores reciben los datos técnicos o personales necesarios
            para prestar sus servicios y pueden tratarlos desde otros países de acuerdo con sus
            propias condiciones y medidas de protección.
          </p>
          <p className="mt-3">
            No vendemos tus datos. Solo los compartimos con estos proveedores, con autoridades
            cuando exista obligación legal o con terceros autorizados por ti o por la ley.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">5. Conservación y seguridad</h2>
          <p className="mt-3">
            Conservamos los datos de la cuenta y el progreso mientras la cuenta esté activa. Después
            de solicitar su cierre, eliminaremos o anonimizaremos los datos cuando sea posible,
            salvo aquellos que debamos conservar por obligaciones legales, contables o para
            acreditar una autorización. Aplicamos controles de acceso y medidas técnicas razonables
            para proteger la información; ningún servicio en Internet puede garantizar riesgo cero.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">6. Tus derechos</h2>
          <p className="mt-3">
            Conforme a la Ley 1581 de 2012 y sus normas reglamentarias, puedes conocer, actualizar y
            rectificar tus datos; solicitar prueba de la autorización, información sobre su uso o su
            supresión; y revocar la autorización cuando sea legalmente procedente. También puedes
            presentar consultas y reclamos ante el responsable.
          </p>
          <p className="mt-3">
            Envía tu solicitud a {privacyEmail}, indicando tu nombre, el correo de tu cuenta y el
            derecho que deseas ejercer. Las consultas se atienden en un máximo de 10 días hábiles,
            prorrogables hasta por 5 días hábiles en los casos previstos por la ley. Los reclamos
            completos se atienden en un máximo de 15 días hábiles, prorrogables hasta por 8 días
            hábiles bajo las condiciones legales. Si no recibes respuesta o consideras que se
            incumplieron tus derechos, puedes acudir a la Superintendencia de Industria y Comercio,
            una vez agotado el trámite previo ante el responsable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">7. Cambios a esta política</h2>
          <p className="mt-3">
            Publicaremos en esta página cualquier actualización e indicaremos su fecha de vigencia.
            Si un cambio requiere una nueva autorización, volveremos a solicitarla antes de tratar
            tus datos con la nueva finalidad.
          </p>
        </section>
      </div>

      <Link
        to="/cookies"
        className="mt-10 inline-flex text-sm text-foreground underline underline-offset-4"
      >
        Consulta también el aviso de cookies y almacenamiento
      </Link>
    </article>
  );
}
