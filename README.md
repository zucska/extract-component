# theShukran React/React Native Utils

Easily refactor React/React Native source code extracting components and styles from the VSCode menu.

* * *

## Core functionalities:
- Extraction: 
    - extract component to new file
    - extract component to function
- Embed:
    - Wrap element a component of choice (e.g. div, View)
- Style: 
    - Extract style from element to StyleSheet (only React Native)  


Also creates a package.json for referencing components (e.g. `import MyComponent from '@components/my-component'`)


* * *

## Settings:
- `extractcomponent.path`: components destination path (relative to project) _(default: "src/components/")_