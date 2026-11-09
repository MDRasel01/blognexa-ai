<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\BlogStudio;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class Module extends AbstractModule
{
    public function getId(): string
    {
        return 'blog-studio';
    }

    public function getName(): string
    {
        return __('Blog Studio', 'blognexa-ai');
    }
}

