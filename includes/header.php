<!DOCTYPE html>
<html lang="en" class="h-full bg-[#F5F7FA]">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GradeFlow — Academic &amp; Grading Management System</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
                    },
                    colors: {
                        /* Academic Prestige Palette */
                        brand: {
                            50: '#EBF1F8',
                            100: '#D8E4F3',
                            200: '#B8CCE6',
                            300: '#8FAFD6',
                            400: '#6E93C0',
                            500: '#5276A7', /* Slate Blue — Secondary & Info */
                            600: '#17243A', /* Midnight Navy — Primary Brand */
                            700: '#243752', /* Deep Navy — Primary Hover */
                            800: '#121D2F',
                            900: '#0C1422',
                        },
                        prestige: {
                            navy: '#17243A',
                            navyHover: '#243752',
                            slateBlue: '#5276A7',
                            slateBlueBg: '#EBF1F8',
                            slateBlueText: '#2C4870',
                            teal: '#0F766E',      /* Deep Teal — Success */
                            mint: '#D5F0EA',      /* Pale Mint — Success BG */
                            plum: '#9B3F72',      /* Berry Plum — Danger / Failed */
                            berry: '#842D60',     /* Dark Berry — Danger Text */
                            roseBg: '#F5DFEB',    /* Soft Rose — Danger BG */
                            amber: '#B7791F',     /* Antique Amber — Warning */
                            amberText: '#80530F', /* Dark Amber — Warning Text */
                            sandBg: '#FFF0D1',    /* Pale Sand — Warning BG */
                            cloud: '#F5F7FA',     /* Cloud White — Main Background */
                            border: '#D8DEE8',    /* Cool Gray — Borders */
                            ink: '#17243A',       /* Ink Navy — Primary Text */
                            muted: '#64748B',     /* Slate Gray — Secondary Text */
                        }
                    }
                }
            }
        };
    </script>
    <!-- Application Stylesheet -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="h-full w-full overflow-x-hidden font-sans text-sm sm:text-base text-[#17243A] antialiased bg-[#F5F7FA] selection:bg-[#17243A] selection:text-white">
