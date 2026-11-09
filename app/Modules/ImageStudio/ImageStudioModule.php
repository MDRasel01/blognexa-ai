<?php
declare(strict_types=1);

namespace BlogNexaAI\Modules\ImageStudio;

use BlogNexaAI\Modules\AbstractModule;

if (!defined('ABSPATH')) {
    exit;
}

final class ImageStudioModule extends AbstractModule
{
    public function getId(): string
    {
        return 'image-studio';
    }

    public function getName(): string
    {
        return __('AI Image Studio', 'blognexa-ai');
    }
}

