# CAD Analysis Pro

A comprehensive CAD analysis application built with React, TypeScript, and advanced algorithms for intelligent îlot placement and corridor generation.

## Features

- **CAD File Processing**: Supports DXF, DWG, and PDF file formats
- **Intelligent Îlot Placement**: Advanced genetic algorithms for optimal space utilization
- **Automated Corridor Generation**: Creates corridors between facing îlots with configurable width
- **Real-time Visualization**: Interactive floor plan visualization with professional rendering
- **Export Capabilities**: Export to PDF reports, DXF files, 3D models, and JSON data
- **Accessibility Compliance**: Configurable corridor width and accessibility standards

## Corridor Generation Rules

1. **Automatic Detection**: If two rows of islands are facing each other, a corridor is automatically created between them
2. **Configurable Width**: User-configurable corridor width (default: 1.2m, minimum: 0.8m)
3. **Smart Placement**: Corridors touch islands on each side but never cut or overlap them
4. **Boundary Respect**: Placement respects walls (black), prohibited areas (blue), and input/output zones (red)
5. **Realistic Layouts**: Generated plans resemble actual office spaces, not just stacked islands

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1
- **Icons**: Lucide React
- **3D Graphics**: Three.js
- **CAD Processing**: Custom algorithms with JSTS geometry processing
- **File Handling**: PDF-lib, file-saver

## Local Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5000
```

## Deployment

### Render (Static Site)

1. Connect your GitHub repository to Render
2. Use the included `render.yaml` configuration
3. Build command: `npm run build`
4. Publish directory: `./dist`

### Netlify

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Uses included `netlify.toml` and `_redirects` for SPA routing

### Vercel

1. Import project to Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Uses included `vercel.json` configuration

### Docker

```bash
# Build image
docker build -t cad-analysis-pro .

# Run container
docker run -p 80:80 cad-analysis-pro
```

## Architecture

### Core Components

- **CADAnalysisApp**: Main application component
- **CADProcessor**: Extracts floor plans from CAD files
- **IlotOptimizer**: Genetic algorithm for optimal îlot placement
- **CorridorGenerator**: Advanced pathfinding for corridor creation
- **ExportManager**: Handles multiple export formats

### Processing Pipeline

1. **File Upload**: Validates and processes CAD files
2. **Floor Plan Extraction**: Identifies walls, doors, and boundaries
3. **Îlot Optimization**: Places îlots using constraint satisfaction
4. **Corridor Generation**: Creates intelligent corridor networks
5. **Export**: Generates professional outputs

## Configuration

### Corridor Settings

- **Width**: 800mm - 3000mm (configurable)
- **Min Clearance**: 300mm - 1500mm
- **Max Length**: 5m - 50m
- **Accessibility**: ADA compliance toggle

### Îlot Types

- **Small**: 4-6m² (2.0m × 2.5m)
- **Medium**: 6-10m² (2.5m × 3.0m)
- **Large**: 10-15m² (3.0m × 4.0m)

## Security

- Content Security Policy headers
- XSS protection
- Frame-Options: DENY
- Secure file upload validation
- Input sanitization

## Performance

- Code splitting with Rollup
- Gzip compression
- Static asset caching
- Optimized rendering algorithms
- Efficient geometry calculations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Professional CAD Analysis Application - All Rights Reserved