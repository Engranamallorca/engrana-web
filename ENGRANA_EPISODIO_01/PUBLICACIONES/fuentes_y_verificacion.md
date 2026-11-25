# Fuentes y verificación — Episodio 01

**Título:** La inteligencia artificial ya no solo responde. Ahora empieza a trabajar.

## Afirmaciones del guion y en qué se apoyan

| Afirmación del vídeo | Estado | Fuente |
|---|---|---|
| Pasamos de una IA que responde a otra que puede ejecutar tareas mediante herramientas | Capacidad actual (agentes con uso de herramientas) | Anthropic, *Building effective agents*: los agentes son LLM que dirigen su propio proceso y su uso de herramientas; el bloque básico es un LLM con recuperación de datos, herramientas y memoria. |
| Conectar diferentes herramientas para completar un proceso | Capacidad actual, depende de la integración | Anthropic, *Introducing the Model Context Protocol* (estándar abierto para conectar asistentes con los sistemas donde están los datos). |
| Analizar un correo, extraer datos, consultar sistemas, preparar respuesta, registrar en CRM, crear tarea | Técnicamente posible hoy con integraciones a medida. **No es automático ni universal**: depende de los datos y sistemas de cada empresa | Patrones descritos en las guías de Anthropic y OpenAI. El caso del vídeo es **ilustrativo** (se indica en pantalla). |
| Algunas decisiones necesitan revisión humana (precios, pedidos, pagos, compromisos) | Buena práctica recomendada | OpenAI, *A practical guide to building agents* (escalado a una persona ante acciones de alto riesgo, sensibles o irreversibles) y documentación de *guardrails y aprobaciones*. |

El vídeo **no incluye cifras ni porcentajes**, por lo que no hay datos estadísticos que citar.

## Enlaces

- Anthropic — Building effective agents: https://www.anthropic.com/engineering/building-effective-agents
- OpenAI — A practical guide to building agents (PDF): https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- OpenAI — Guardrails and human approvals: https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- Anthropic — Introducing the Model Context Protocol: https://www.anthropic.com/news/model-context-protocol

## Lectura adicional (no citada en el vídeo)

- Reglamento (UE) 2024/1689 de Inteligencia Artificial, art. 14 (supervisión humana en sistemas de alto riesgo): https://artificialintelligenceact.eu/es/article/14/
- AESIA — Guía de vigilancia humana: https://aesia.digital.gob.es/storage/media/06-guia-vigilancia-humana.pdf

> Nota: el art. 14 se refiere a sistemas de **alto riesgo**. Un agente comercial como el del ejemplo no tiene por qué entrar en esa categoría; se cita solo como contexto sobre la idea de supervisión humana.
