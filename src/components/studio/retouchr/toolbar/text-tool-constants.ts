// Font options
export const FONT_OPTIONS = [
    // Sans-serif fonts
    { value: 'Arial', label: 'Arial', category: 'sans-serif' },
    { value: 'Helvetica', label: 'Helvetica', category: 'sans-serif' },
    { value: 'Verdana', label: 'Verdana', category: 'sans-serif' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS', category: 'sans-serif' },
    { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
    { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
    { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
    { value: 'Lato', label: 'Lato', category: 'sans-serif' },
    { value: 'Raleway', label: 'Raleway', category: 'sans-serif' },
    { value: 'Poppins', label: 'Poppins', category: 'sans-serif' },
    { value: 'Ubuntu', label: 'Ubuntu', category: 'sans-serif' },
  
    // Serif fonts
    { value: 'Times New Roman', label: 'Times New Roman', category: 'serif' },
    { value: 'Georgia', label: 'Georgia', category: 'serif' },
    { value: 'Palatino', label: 'Palatino', category: 'serif' },
    { value: 'Garamond', label: 'Garamond', category: 'serif' },
    { value: 'Baskerville', label: 'Baskerville', category: 'serif' },
    { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
    { value: 'Merriweather', label: 'Merriweather', category: 'serif' },
  
    // Monospace fonts
    { value: 'Courier New', label: 'Courier New', category: 'monospace' },
    { value: 'Consolas', label: 'Consolas', category: 'monospace' },
    { value: 'Monaco', label: 'Monaco', category: 'monospace' },
    { value: 'Source Code Pro', label: 'Source Code Pro', category: 'monospace' },
  
    // Display & Decorative fonts
    { value: 'Pacifico', label: 'Pacifico', category: 'display' },
    { value: 'Dancing Script', label: 'Dancing Script', category: 'display' },
    { value: 'Lobster', label: 'Lobster', category: 'display' },
    { value: 'Permanent Marker', label: 'Permanent Marker', category: 'display' },
    { value: 'Satisfy', label: 'Satisfy', category: 'display' },
    { value: 'Comfortaa', label: 'Comfortaa', category: 'display' }
  ];
  
  // Text preset styles
  export const TEXT_PRESETS = [
    {
      id: 'heading1',
      label: 'Heading 1',
      properties: {
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'Montserrat',
        lineHeight: 1.2
      }
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      properties: {
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: 'Montserrat',
        lineHeight: 1.3
      }
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      properties: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'Raleway',
        lineHeight: 1.4
      }
    },
    {
      id: 'subheading1',
      label: 'Subheading',
      properties: {
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'italic',
        fontFamily: 'Open Sans',
        lineHeight: 1.5
      }
    },
    {
      id: 'body',
      label: 'Body Text',
      properties: {
        fontSize: 16,
        fontWeight: 'normal',
        fontFamily: 'Roboto',
        lineHeight: 1.6
      }
    },
    {
      id: 'quote',
      label: 'Quote',
      properties: {
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        lineHeight: 1.6,
        backgroundColor: 'rgba(240, 240, 240, 0.7)',
        padding: 15,
        borderRadius: 8
      }
    },
    {
      id: 'caption',
      label: 'Caption',
      properties: {
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Lato',
        lineHeight: 1.4
      }
    },
    {
      id: 'callout',
      label: 'Callout',
      properties: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        backgroundColor: 'rgba(255, 240, 200, 0.7)',
        padding: 10,
        borderRadius: 8
      }
    }
  ];