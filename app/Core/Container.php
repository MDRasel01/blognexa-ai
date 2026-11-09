<?php
/**
 * BlogNexa AI - Service Container
 *
 * @package BlogNexaAI\Core
 */

declare(strict_types=1);

namespace BlogNexaAI\Core;

use Closure;
use InvalidArgumentException;

if (!defined('ABSPATH')) {
    exit;
}

final class Container
{
    /**
     * Stored service bindings.
     *
     * @var array<string, mixed>
     */
    private array $bindings = [];

    /**
     * Stored resolved singletons.
     *
     * @var array<string, object>
     */
    private array $instances = [];

    /**
     * Register a service binding.
     *
     * @param string $id
     * @param mixed $concrete
     * @param bool $shared Whether it is a singleton
     */
    public function bind(string $id, mixed $concrete, bool $shared = false): void
    {
        $this->bindings[$id] = [
            'concrete' => $concrete,
            'shared'   => $shared,
        ];
    }

    /**
     * Register a singleton instance.
     *
     * @param string $id
     * @param mixed $concrete
     */
    public function singleton(string $id, mixed $concrete): void
    {
        $this->bind($id, $concrete, true);
    }

    /**
     * Register an existing instance as a singleton.
     *
     * @param string $id
     * @param object $instance
     */
    public function instance(string $id, object $instance): void
    {
        $this->instances[$id] = $instance;
    }

    /**
     * Resolve a service by identifier.
     *
     * @template T
     * @param class-string<T>|string $id
     * @return T|object
     * @throws InvalidArgumentException
     */
    public function get(string $id): object
    {
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }

        if (!isset($this->bindings[$id])) {
            // Attempt auto-wiring if class exists
            if (class_exists($id)) {
                $instance = new $id();
                return $instance;
            }
            throw new InvalidArgumentException(sprintf('Service [%s] is not registered in the container.', $id));
        }

        $binding = $this->bindings[$id];
        $concrete = $binding['concrete'];

        if ($concrete instanceof Closure) {
            $object = $concrete($this);
        } elseif (is_string($concrete) && class_exists($concrete)) {
            $object = new $concrete();
        } elseif (is_object($concrete)) {
            $object = $concrete;
        } else {
            throw new InvalidArgumentException(sprintf('Invalid concrete binding for service [%s].', $id));
        }

        if ($binding['shared']) {
            $this->instances[$id] = $object;
        }

        return $object;
    }

    /**
     * Check if a service identifier exists.
     *
     * @param string $id
     * @return bool
     */
    public function has(string $id): bool
    {
        return isset($this->bindings[$id]) || isset($this->instances[$id]);
    }
}

