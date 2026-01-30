# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Summagraph (www.summagraph.com) is a web application that generates infographic images from user text input. Users can customize the generation by selecting:
- Visual style
- Layout options
- Number of images to generate
- Language (English or Chinese)

The application follows a three-step flow:
1. Input text and select options (style, layout, image count, language)
2. Loading state during generation
3. Display generated results

## Architecture

### Tech Stack
- **Frontend**: Modern web framework with clean, tech-forward design aesthetic
- **Backend Integration**: Image generation via `/baoyu-xhs-images` skill API
- **Design Philosophy**: Minimalist, premium, tech-inspired UI

### Key Components
- **Input Form**: Text area for user input + option selectors
- **Generation Engine**: Integration with infographic generation skill
- **Results Display**: Gallery/grid view of generated images
- **Loading State**: Visual feedback during generation process

## Development Commands

*Note: This section will be updated as the project builds out*

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code
npm run lint

# Run tests
npm test
```

## Design Requirements

### Visual Style
- Clean, minimalist interface
- Premium, tech-forward aesthetic
- Modern typography and spacing
- Subtle animations and transitions
- Responsive design across devices

### User Experience
- Simple, intuitive workflow
- Clear visual hierarchy
- Immediate feedback on user actions
- Professional loading states
- Easy image download/share options

## Integration Notes

### Image Generation
The core infographic generation uses the `/baoyu-xhs-images` skill, which:
- Accepts text input and generation parameters
- Returns series of infographic-style images
- Supports multiple visual styles and layouts
- Handles both English and Chinese text

### API Flow
1. User submits form with text and options
2. Backend calls infographic generation API
3. Display loading state during processing
4. Render generated images in results view
5. Provide download/share functionality

## File Structure

```
summagraph/
├── src/
│   ├── components/       # React/UI components
│   ├── pages/           # Page routes
│   ├── services/        # API integration
│   ├── styles/          # Global styles and themes
│   └── utils/           # Helper functions
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

## Important Considerations

- Ensure all user-facing text supports i18n (English/Chinese)
- Image generation may take time - implement proper timeout handling
- Design for mobile-first, then scale up to desktop
- Maintain accessibility standards (WCAG AA minimum)
- Optimize for fast initial page load
