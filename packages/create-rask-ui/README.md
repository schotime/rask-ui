# create-rask-ui

Scaffold a new Rask UI project with interactive prompts.

## Usage

### Interactive Mode

```bash
npx create-rask-ui
```

You'll be prompted to:

1. Choose **TypeScript** or **JavaScript**
2. Select **Current folder** or create a **New folder**
3. If creating a new folder, enter the **project name**

### With Folder Name

Skip the folder selection prompts by providing a folder name:

```bash
npx create-rask-ui my-app
```

This will:
- Create a new folder called `my-app`
- Only prompt you to select a language (TypeScript or JavaScript)
- Copy the selected template
- Install dependencies automatically
- Set up a complete Vite + Rask UI project

## What's Included

Both templates include:

- **Vite** - Lightning-fast development server and build tool
- **Rask UI** - Fast, reactive UI library
- **Inferno** - Blazing fast React-like library
- Sample counter component to get started
- Hot Module Replacement (HMR) configured

### TypeScript Template

Additional features:
- Full TypeScript configuration
- Type definitions for Rask UI and Vite
- Strict type checking enabled

### JavaScript Template

Additional features:
- JSConfig for better IDE support
- JSX support configured

## Getting Started

After creating your project:

```bash
# If you provided a folder name:
cd my-app
npm run dev

# If you used current folder:
npm run dev
```

Your app will be running at `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Learn More

- [Rask UI Documentation](https://github.com/christianalfoni/rask-ui)
- [Vite Documentation](https://vitejs.dev)
- [Inferno Documentation](https://infernojs.org)
