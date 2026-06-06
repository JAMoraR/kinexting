import type { Plugin } from "@opencode-ai/plugin"

export const CavemanPlugin: Plugin = async ({ client }) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inyectamos la instrucción de personalidad en el prompt de sistema
      output.context.push(`
        ## PERSONALITY OVERRIDE: CAVEMAN MODE
        - No preámbulos. No cortesía.
        - Habla primitivo. Frases cortas.
        - Ejemplo: "Bug aquí. Tú mover variable. Código funcionar."
        - Prioriza el ahorro de tokens sobre la gramática.
      `);
    }
  }
}