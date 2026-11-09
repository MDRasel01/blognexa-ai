<?php
/**
 * BlogNexa AI - Standard REST API Response Formatter
 *
 * @package BlogNexaAI\API\Responses
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Responses;

use WP_REST_Response;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

class APIResponse
{
    /**
     * Create a standard success response.
     *
     * @param mixed $data
     * @param int $statusCode
     * @param array<string, mixed> $meta
     * @return WP_REST_Response
     */
    public static function success(mixed $data = null, int $statusCode = 200, array $meta = []): WP_REST_Response
    {
        $payload = [
            'success'   => true,
            'data'      => $data,
            'timestamp' => gmdate('c'),
        ];

        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        return new WP_REST_Response($payload, $statusCode);
    }

    /**
     * Create a standard error response using WP_Error.
     *
     * @param string $code
     * @param string $message
     * @param int $statusCode
     * @param mixed $details
     * @return WP_Error
     */
    public static function error(string $code, string $message, int $statusCode = 400, mixed $details = null): WP_Error
    {
        $data = ['status' => $statusCode];
        if ($details !== null) {
            $data['details'] = $details;
        }

        return new WP_Error($code, $message, $data);
    }
}

if (!class_exists('BlogNexaAI\API\Responses\ApiResponse', false)) {
    class_alias(APIResponse::class, 'BlogNexaAI\API\Responses\ApiResponse');
}
