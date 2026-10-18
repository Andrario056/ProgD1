# Design System — Centro de Vacunación Salud

## Paleta de Colores

| Nombre              | Rol                    | Hex       |
| ------------------- | ---------------------- | --------- |
| Azul Institucional  | Primario               | `#0066CC` |
| Celeste Clínico     | Secundario             | `#E6F0FA` |
| Verde Salud         | Acento                 | `#2E7D32` |
| Gris Texto          | Neutro / Texto         | `#2C3E50` |

### Detalle

- **Azul Institucional** (`#0066CC`) — Primario. Color principal de marca. Usar en acciones primarias, encabezados y elementos de mayor jerarquía.
- **Celeste Clínico** (`#E6F0FA`) — Secundario. Fondos suaves, superficies y estados secundarios. Bajo contraste, no usar para texto.
- **Verde Salud** (`#2E7D32`) — Acento. Confirmaciones, indicadores de éxito, estados positivos y llamados secundarios.
- **Gris Texto** (`#2C3E50`) — Neutro / Texto. Texto principal, íconos y bordes neutros.

## Tokens (Tailwind v4)

```css
@theme {
	--color-primario: #0066cc;
	--color-secundario: #e6f0fa;
	--color-acento: #2e7d32;
	--color-texto: #2c3e50;
}
```
