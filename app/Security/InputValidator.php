<?php
/**
 * BlogNexa AI - Input Validator & Sanitizer
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class InputValidator
{
    /**
     * Sanitize clean text string and neutralize all script/style tags.
     *
     * @param mixed $input
     * @return string
     */
    public static function sanitizeText(mixed $input): string
    {
        $str = is_string($input) ? $input : (string) $input;

        // Strip HTML script and style tags along with their inner content
        $str = preg_replace('@<(script|style)[^>]*?>.*?</\\1>@si', '', $str) ?? '';

        if (function_exists('sanitize_text_field')) {
            return sanitize_text_field($str);
        }

        return strip_tags(trim($str));
    }

    /**
     * Sanitize URL with protocol checks.
     *
     * @param mixed $input
     * @return string
     */
    public static function sanitizeUrl(mixed $input): string
    {
        return esc_url_raw(is_string($input) ? $input : '');
    }

    /**
     * Sanitize integer ID.
     *
     * @param mixed $input
     * @return int
     */
    public static function sanitizeId(mixed $input): int
    {
        return absint($input);
    }

    /**
     * Validate UUID v4.
     *
     * @param string $uuid
     * @return bool
     */
    public static function isValidUuid(string $uuid): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid);
    }

    /**
     * Sanitize array recursively.
     *
     * @param array<mixed> $array
     * @return array<mixed>
     */
    public static function sanitizeArray(array $array): array
    {
        $sanitized = [];
        foreach ($array as $key => $value) {
            $sanitizedKey = sanitize_key((string) $key);
            if (is_array($value)) {
                $sanitized[$sanitizedKey] = self::sanitizeArray($value);
            } elseif (is_string($value)) {
                $sanitized[$sanitizedKey] = self::sanitizeText($value);
            } else {
                $sanitized[$sanitizedKey] = $value;
            }
        }
        return $sanitized;
    }
}
