---
description: Scaffold AI inference client services for local LLM, vision, and embeddings
agent: build
---
# Scaffold AI inference client services

## When to use
Use when integrating local AI inference (LLM, vision, embeddings) into a Laravel project, or when adding multi-provider LLM support.

## Services available

Check `~/.config/opencode/local/inference-services.md` for this machine's actual endpoints, models, and ports.

All services expose OpenAI-compatible `/v1/` endpoints. No OpenAI SDK required — use Laravel HTTP facade.

## Environment variables

Read actual values from `~/.config/opencode/local/inference-services.md` and populate the project's `.env`:

```bash
# .env
LLM_PROVIDER=vllm          # vllm|openai|anthropic|bedrock
LLM_BASE_URL=               # from local/inference-services.md
LLM_API_KEY=               # empty for local vLLM
LLM_MODEL=                 # from local/inference-services.md
LLM_TIMEOUT=60

VISION_BASE_URL=            # from local/inference-services.md
VISION_MODEL=               # from local/inference-services.md
VISION_TIMEOUT=90

TEI_BASE_URL=               # from local/inference-services.md
TEI_MODEL=                  # from local/inference-services.md
TEI_DIMENSIONS=1024
```

## Config registration

```php
// config/services.php — no hardcoded defaults for URLs/models
'llm' => [
    'provider'  => env('LLM_PROVIDER', 'vllm'),
    'base_url'  => env('LLM_BASE_URL'),
    'api_key'   => env('LLM_API_KEY'),
    'model'     => env('LLM_MODEL'),
    'timeout'   => (int) env('LLM_TIMEOUT', 60),
],
'vision' => [
    'base_url'  => env('VISION_BASE_URL'),
    'model'     => env('VISION_MODEL'),
    'timeout'   => (int) env('VISION_TIMEOUT', 90),
],
'embeddings' => [
    'base_url'   => env('TEI_BASE_URL'),
    'model'      => env('TEI_MODEL'),
    'dimensions' => (int) env('TEI_DIMENSIONS', 1024),
],
```

## Files to scaffold

```
app/Services/AI/
├── LlmProviderInterface.php    # Interface: complete(), isAvailable()
├── VllmProvider.php             # Local vLLM (see local/inference-services.md)
├── OpenAiProvider.php           # OpenAI API (optional)
├── VisionClient.php             # Image-to-text (see local/inference-services.md)
├── EmbeddingClient.php          # Text embeddings via TEI
└── CircuitBreaker.php           # Resilience wrapper
```

## Provider interface

```php
interface LlmProviderInterface
{
    public function complete(array $messages, array $options = []): string;
    public function isAvailable(): bool;
}
```

Every provider implements this. The service container binds the active one based on `LLM_PROVIDER`.

## API call patterns

**Chat completion (LLM):**
```php
Http::baseUrl(config('services.llm.base_url'))
    ->timeout(config('services.llm.timeout'))
    ->post('/v1/chat/completions', [
        'model'       => config('services.llm.model'),
        'messages'    => $messages,
        'temperature' => $options['temperature'] ?? 0.7,
        'max_tokens'  => $options['max_tokens'] ?? 2048,
    ]);
```

**Vision (base64 image):**
```php
Http::baseUrl(config('services.vision.base_url'))
    ->timeout(config('services.vision.timeout'))
    ->post('/v1/chat/completions', [
        'model'    => config('services.vision.model'),
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => [
                ['type' => 'image_url', 'image_url' => ['url' => "data:image/jpeg;base64,{$b64}"]],
                ['type' => 'text', 'text' => $prompt],
            ]],
        ],
        'max_tokens' => 4096,
    ]);
```

**Embeddings (TEI):**
```php
// TEI uses /embed not /v1/embeddings
Http::baseUrl(config('services.embeddings.base_url'))
    ->post('/embed', [
        'inputs'   => $texts,   // string or array of strings
        'truncate' => true,
    ]);
// Returns: [[1024 floats], ...] — one vector per input
```

## Circuit breaker

Wrap every AI call. Open after repeated failures, half-open after cooldown.

```php
new CircuitBreaker(
    service: 'llm',
    failureThreshold: 5,
    recoveryTimeout: 30,
    successThreshold: 2,
);
```

## Rules

- Always use config values, never hardcode URLs or model names
- TEI uses `/embed` endpoint, not `/v1/embeddings`
- Vision payloads can be large — set timeout to 90s+
- Batch embedding calls where possible (array of inputs) for efficiency
- Circuit breaker is mandatory — local inference services may be offline
- When adding a new provider, implement `LlmProviderInterface` and register in the service container

## Guides
- `guides/ai-engineering.md` — model selection, prompt engineering, RAG patterns, evals, production AI patterns

## Key modules
- `modules/ai-llm/` — full LLM integration module with prompt management and RAG
- `modules/ai-agents/` — autonomous agent loops using local inference
