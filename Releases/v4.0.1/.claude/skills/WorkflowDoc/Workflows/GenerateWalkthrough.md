# GenerateWalkthrough

Generate a complete step-by-step walkthrough document for any interactive UI workflow. Works with any language, framework, and platform — TUI, web, desktop, mobile, or CLI wizard.

---

## Process (8 Steps)

**Two-stage pipeline:** Steps 1–7 extract source code into structured YAML. Step 8 renders YAML into markdown via the RenderWalkthrough workflow.

### Step 1: RESOLVE

Match the user's request to a WorkflowRegistry.md entry (if one exists for this project).

1. Read `<project>/.claude/skill-data/WorkflowRegistry.md`
2. If no registry exists, ask the user to identify the source files for the workflow
3. If the request is ambiguous (e.g., "document the chart"), list candidates and ask the user to clarify
4. Identify: workflow name, source files, step type (flat/multi-step/modal/sub-views), entry key

**Output:** Workflow name, list of source files to read, step type classification.

### Step 2: DETECT FRAMEWORK

Before extracting, identify the language, framework, and platform from the source files.

**Detection heuristics:**

#### TUI Frameworks

| Signal | Framework |
|--------|-----------|
| `.go` files + `tea.KeyMsg` / `bubbletea` import | Go / BubbleTea |
| `.go` files + `tview` import | Go / tview |
| `.go` files + `tcell` import | Go / tcell (raw) |
| `.py` files + `textual` import / `class X(App)` | Python / Textual |
| `.py` files + `curses` import | Python / curses |
| `.py` files + `prompt_toolkit` import | Python / prompt_toolkit |
| `.rs` files + `ratatui` / `crossterm` in `Cargo.toml` | Rust / Ratatui |
| `.rs` files + `cursive` in `Cargo.toml` | Rust / Cursive |
| `.ts`/`.js` files + `ink` import / `React` + `useInput` | JS / Ink |
| `.ts`/`.js` files + `blessed` import | JS / Blessed |
| `.ts`/`.js` files + `terminal-kit` import | JS / terminal-kit |
| `.c`/`.cpp` files + `ncurses.h` include | C / ncurses |

#### Web Frameworks

| Signal | Framework |
|--------|-----------|
| `.tsx`/`.jsx` files + `react` import + `react-router` / `next` / `remix` | React (Next.js / Remix / SPA) |
| `.vue` files + `<script setup>` / `vue-router` | Vue |
| `.svelte` files + `+page.svelte` / `$app/navigation` | SvelteKit |
| `.ts` files + `@angular/` imports + `@Component` | Angular |
| `.astro` files + `Astro.props` | Astro |

#### Desktop Frameworks

| Signal | Framework |
|--------|-----------|
| `.ts`/`.js` files + `electron` import / `BrowserWindow` | Electron |
| `.py` files + `tkinter` / `PyQt` / `PySide` import | Python / Tk or Qt |
| `.swift` files + `SwiftUI` import / `@State` / `View` protocol | Swift / SwiftUI |
| `.cs` files + `System.Windows` / `Avalonia` / `MAUI` namespace | C# / WPF or MAUI |
| `.cpp`/`.h` files + `QWidget` / `QMainWindow` | C++ / Qt |
| `.rs` files + `tauri` in `Cargo.toml` | Rust / Tauri |

#### Mobile Frameworks

| Signal | Framework |
|--------|-----------|
| `.tsx`/`.jsx` files + `react-native` import / `TouchableOpacity` | React Native |
| `.dart` files + `flutter` / `material.dart` import | Flutter |
| `.swift` files + `UIKit` / `UIViewController` | Swift / UIKit |
| `.kt` files + `@Composable` / `Jetpack Compose` import | Kotlin / Compose |
| `.kt`/`.java` files + `Activity` / `Fragment` extends | Android / Views |

#### CLI Wizard Frameworks

| Signal | Framework |
|--------|-----------|
| `.ts`/`.js` files + `inquirer` / `@inquirer/prompts` import | JS / Inquirer |
| `.ts`/`.js` files + `enquirer` import | JS / Enquirer |
| `.ts`/`.js` files + `prompts` import (terkelg) | JS / prompts |
| `.go` files + `survey` / `promptui` import | Go / Survey or promptui |
| `.py` files + `questionary` / `InquirerPy` import | Python / questionary |
| `.rs` files + `dialoguer` / `inquire` in `Cargo.toml` | Rust / dialoguer |

If the framework isn't recognized, fall back to **generic extraction** — search for switch/case, if-else chains, match arms, event listeners, or route definitions that map interactions to state transitions.

**Output:** Language, framework name, platform type (TUI/Web/Desktop/Mobile/CLI), extraction pattern set to use.

### Step 3: EXTRACT

Read source files and extract the state machine structure using platform- and framework-specific patterns.

#### 3a. Find State/Step Definitions

Look for the step enum, state type, route path, screen identifier, or equivalent:

**TUI — Go / BubbleTea:**
```go
type wizardStep int
const (
    wizardStepName   wizardStep = 0
    wizardStepTheme  wizardStep = 1
)
```

**TUI — Python / Textual:**
```python
class Step(Enum):
    SYMBOL = "symbol"
    SIDE = "side"

# or plain strings / ints
self.step = "symbol"
self.current_step = 0
```

**TUI — Rust / Ratatui:**
```rust
enum Step {
    Symbol,
    Side,
    Type,
}
// or
#[derive(PartialEq)]
enum AppState { Input, Select, Confirm }
```

**TUI — JS / Ink:**
```js
const STEPS = { SYMBOL: 0, SIDE: 1, TYPE: 2 };
// or
const [step, setStep] = useState('symbol');
// or
type Step = 'symbol' | 'side' | 'type';
```

**Web — React Router / Next.js / SvelteKit:**
```jsx
// Route-based steps
<Route path="/checkout/shipping" element={<Shipping />} />
<Route path="/checkout/payment" element={<Payment />} />
<Route path="/checkout/confirm" element={<Confirm />} />

// or state-based steps within a single route
const [step, setStep] = useState<'shipping' | 'payment' | 'confirm'>('shipping');

// or URL search params
const step = searchParams.get('step') ?? 'shipping';
```

**Desktop — SwiftUI / Electron:**
```swift
// SwiftUI
enum OnboardingStep: Int, CaseIterable {
    case welcome, profile, preferences, done
}
@State private var currentStep: OnboardingStep = .welcome

// Electron (renderer)
const pages = ['welcome', 'profile', 'preferences', 'done'];
```

**Mobile — React Native / Flutter:**
```dart
// Flutter
enum CheckoutStep { cart, shipping, payment, confirmation }
// or page-based via Navigator
Navigator.push(context, MaterialPageRoute(builder: (_) => PaymentPage()));
```

**CLI Wizard — Inquirer / Survey:**
```js
// Sequential prompt array (Inquirer)
const questions = [
  { name: 'name', type: 'input', message: 'Project name?' },
  { name: 'lang', type: 'list', choices: ['Go', 'Rust', 'Python'] },
  { name: 'confirm', type: 'confirm', message: 'Create project?' },
];
```

**Generic fallback:** Search for sequential integer constants, string enums, route definitions, page arrays, or state variables that are compared in handlers.

#### 3b. Find Interaction Handlers

The functions or methods that handle user interactions (keys, clicks, taps, form submissions, gestures, prompt answers):

**Typed keymap shortcut (Go / BubbleTea):** If the project has a typed keymap package (e.g., `internal/tui/keymap/`), read the typed structs for the relevant context instead of parsing switch blocks. The structs contain `key.Binding` fields with exact keys and help text — this is more reliable than regex-parsing dispatch code. Look for `key.Matches(msg, m.keys.X)` patterns in handlers, which reference the typed bindings.

**TUI — Go / BubbleTea:**
```go
func (m model) handleKey(msg tea.KeyMsg) (model, tea.Cmd) {
    switch msg.String() {
    case "j", "down": ...
    case "enter": ...
    }
}
```

**TUI — Python / Textual:**
```python
def on_key(self, event: Key) -> None:
    if event.key == "enter": ...
# or action-based
def action_submit(self) -> None: ...
# or bindings
BINDINGS = [Binding("j", "cursor_down", "Down")]
```

**TUI — Rust / Ratatui:**
```rust
fn handle_key(&mut self, key: KeyEvent) {
    match key.code {
        KeyCode::Char('j') | KeyCode::Down => { ... }
        KeyCode::Enter => { ... }
    }
}
```

**TUI — JS / Ink:**
```js
useInput((input, key) => {
    if (key.return) { ... }
    if (input === 'j' || key.downArrow) { ... }
});
```

**Web — React / Vue / Svelte:**
```jsx
// Event handlers (React)
<button onClick={handleNext}>Continue</button>
<form onSubmit={handleShipping}>
<input onChange={e => setField(e.target.value)} />

// Route navigation
navigate('/checkout/payment');
router.push({ name: 'payment' });

// Form libraries
const { handleSubmit } = useForm();
formAction(formData);

// State management dispatches
dispatch({ type: 'NEXT_STEP' });
store.nextStep();
```

**Desktop — SwiftUI / Electron / Qt:**
```swift
// SwiftUI
Button("Next") { currentStep = .profile }
.onSubmit { validateAndAdvance() }
.keyboardShortcut(.return, modifiers: [])

// Electron (IPC)
ipcRenderer.send('wizard:next', formData);

// Qt (signals/slots)
connect(nextButton, &QPushButton::clicked, this, &Wizard::nextPage);
```

**Mobile — React Native / Flutter:**
```dart
// Flutter
ElevatedButton(onPressed: () => goToPayment(), child: Text('Continue'))
GestureDetector(onSwipeLeft: () => nextStep())

// React Native
<TouchableOpacity onPress={handleNext}>
<TextInput onSubmitEditing={handleSearch} />
```

**CLI Wizard — Inquirer / Survey / promptui:**
```js
// Inquirer.js — sequential prompts
const answers = await inquirer.prompt(questions);
// Each question.type determines interaction: input, list, confirm, checkbox

// Go survey
prompt := &survey.Select{ Message: "Pick one:", Options: items }
survey.AskOne(prompt, &answer)
```

**Generic fallback:** Search for:
- `switch`/`case` or `match` on key/input/event variables
- `onClick`, `onPress`, `onSubmit`, `onChange` handler attributes
- Event listener registrations: `.on("click", ...)`, `addEventListener`
- Route definitions mapping URLs to components/handlers
- Form action handlers, `handleSubmit`, `formAction`
- Gesture recognizers and swipe handlers
- Keybinding maps/objects (`{ 'j': handler, 'enter': submit }`)

#### 3c. Find Per-Step Handlers

Many apps delegate to step-specific functions. Look for the dispatch pattern:

**TUI:**
- **Go:** `switch m.step { case stepX: return m.handleXStep(msg) }`
- **Python:** `getattr(self, f"handle_{self.step}")(event)` or explicit `if self.step == Step.X:`
- **Rust:** `match self.step { Step::X => self.handle_x(key) }`
- **JS:** `handlers[step](input, key)` or `switch (step) { case 'x': ... }`

**Web:**
- **Route-per-step:** Each route has its own page component with handlers (`/checkout/shipping` → `ShippingPage`)
- **Single-page wizard:** `switch(step)` in one component, or step components rendered conditionally
- **Form library:** `react-hook-form` / `formik` / `vee-validate` with per-step validation schemas

**Desktop:**
- **SwiftUI:** `switch currentStep { case .welcome: WelcomeView() }`
- **Electron:** IPC handlers per step, or renderer-side step dispatch
- **Qt:** `QStackedWidget` with page index, or `QWizardPage` subclasses

**Mobile:**
- **Navigator stack:** Each step is a separate screen pushed onto the navigation stack
- **Single-screen wizard:** Step components swapped via state, or `PageView`/`ViewPager`

**CLI Wizard:**
- Each prompt in the questions array is a step — the framework handles sequencing automatically
- Custom logic between prompts via `when` conditionals or post-answer transforms

Each per-step handler has its own interaction dispatch — extract all interactions from each.

#### 3d. Find View/Render Functions

Functions that produce the visible UI for each step:

**TUI:**
- **Go / BubbleTea:** `func (m model) View() string` + `viewXStep() string`
- **Python / Textual:** `def compose(self)` + `def render(self)` or `watch_step()` reactive
- **Rust / Ratatui:** `fn draw(&self, frame: &mut Frame)` or `fn render(&self, area: Rect, buf: &mut Buffer)`
- **JS / Ink:** JSX `return <Box>...</Box>` or `render()` method

**Web:**
- **React:** Component JSX return, conditional rendering per step, CSS/styled-components for layout
- **Vue:** `<template>` blocks with `v-if`/`v-show` per step, scoped styles
- **Svelte:** `{#if step === 'shipping'}` blocks, slot-based layouts

**Desktop:**
- **SwiftUI:** `var body: some View { switch step { ... } }`
- **Electron:** HTML templates or React/Vue renderer per window
- **Qt:** `QWizardPage::initializePage()` + layout setup

**Mobile:**
- **Flutter:** `Widget build(BuildContext context)` per page, `Scaffold` + `AppBar` layout
- **React Native:** Component JSX return with `StyleSheet`, navigation header config

**CLI Wizard:**
- The framework renders prompts automatically — extract `message`, `choices`, `default`, `validate` from each question definition

Read these to understand UI layout for mockups (see OutputFormat.md for platform-appropriate mockup format).

#### 3e. Find Render Helpers / UI Components

Common reusable components that appear in views. Names vary by framework and platform:

| Concept | TUI | Web | Desktop / Mobile |
|---------|-----|-----|-----------------|
| Progress | `ProgressBar`, `Gauge`, `renderProgressBar` | `<progress>`, `<LinearProgress>`, stepper | `ProgressView`, `CircularProgressIndicator` |
| Choice list | `renderChoiceList`, `SelectList`, `RadioSet` | `<select>`, `<RadioGroup>`, `<Listbox>` | `Picker`, `DropdownButton`, `QComboBox` |
| Text input | `TextInput`, `Input`, `text_input` | `<input>`, `<TextField>`, `<TextArea>` | `TextField`, `TextFormField`, `QLineEdit` |
| Navigation | `renderNav`, `Footer`, `status_bar` | breadcrumbs, `<nav>`, stepper, back button | `NavigationView`, `AppBar`, `QMenuBar` |
| Slider/range | `renderSlider`, `Slider` | `<input type="range">`, `<Slider>` | `Slider`, `QSlider` |
| Button/action | key hints, `renderNav` | `<button>`, `<a>`, `onClick` | `Button`, `ElevatedButton`, `QPushButton` |
| Form group | box-drawing section | `<form>`, `<fieldset>`, form context | `Form`, `QFormLayout` |

#### 3f. Find Async Operations

Patterns for async/deferred work by platform:

**TUI:**
- **Go / BubbleTea:** `tea.Cmd` returns + `Msg` types in `Update()`
- **Python / Textual:** `self.call_later()`, `asyncio` tasks, `Worker` class
- **Rust / Ratatui:** `tokio::spawn`, channels, `futures` in event loop
- **JS / Ink:** `useEffect`, `Promise`, `async/await` in handlers

**Web:**
- **API calls:** `fetch()`, `axios`, `useSWR`, `useQuery` (React Query / TanStack)
- **Form submission:** `formAction`, server actions (Next.js/Remix), `onSubmit` with `await`
- **Loading states:** `isLoading`, `isPending`, `Suspense`, skeleton/spinner components
- **Optimistic updates:** `useOptimistic`, `useMutation.onMutate`

**Desktop:**
- **SwiftUI:** `Task { await ... }`, `@MainActor`, `AsyncSequence`
- **Electron:** `ipcMain.handle()` / `ipcRenderer.invoke()` async IPC
- **Qt:** `QFuture`, `QtConcurrent::run`, signals across threads

**Mobile:**
- **Flutter:** `Future`, `FutureBuilder`, `async`/`await`, `StreamBuilder`
- **React Native:** same as web React patterns + native module async bridges

**CLI Wizard:**
- **Inquirer:** `validate` async functions, `when` conditionals, `transformer` post-processing
- **Survey (Go):** `survey.WithValidator()`, custom `Transformer`

**Output:** For each step: interactions, actions, transitions, view layout, nav hints, async ops.

### Step 4: MAP

Build the state machine graph from extracted data.

1. **Happy path** — The linear sequence: step 0 -> 1 -> 2 -> ... -> N
   - Each primary action (key press, button click, form submit, tap, prompt answer) advances to the next step
   - Record: which interaction advances, any validation before advancing

2. **Escape paths** — How to go backward or exit:
   - TUI: `esc` to previous step, `q` to quit
   - Web: back button, browser back, `[Cancel]` button, route guard redirect
   - Desktop: `Esc` / `Cmd+Z`, close window, cancel button
   - Mobile: swipe back, back button, `[X]` dismiss
   - CLI: `Ctrl+C` abort, empty input to skip
   - Record: from each step, what cancel/back does

3. **Conditional branches** — Steps that may be skipped:
   - Record: condition, which step is skipped, where control goes instead

4. **Sub-models / child components** — Nested state machines:
   - TUI: sub-models that intercept all keys when active
   - Web: modals, dialogs, drawers, popovers that overlay the main flow
   - Desktop: sheets, popovers, child windows
   - Mobile: bottom sheets, action sheets, nested navigators
   - Record: entry trigger, exit trigger, sub-component behavior

5. **Input modes** — Steps accepting user input:
   - TUI: text input (character buffer + backspace + enter)
   - Web: form fields (text, select, checkbox, radio, file upload)
   - Desktop: text fields, pickers, sliders, color wells
   - Mobile: text fields, date pickers, gesture input
   - CLI: text prompts, list selection, confirm Y/N
   - Record: which steps are free input vs. constrained selection

**Output:** State machine graph with happy path, escape paths, branches.

### Step 5: COMPOSE

Generate the walkthrough document following `OutputFormat.md`.

1. **Header** — Fill in all metadata fields:
   - Application, Platform, Location, Entry point, Step count, Total interactions
   - Difficulty: count interactions and branches to classify
   - Prerequisites: what state must exist before starting

2. **Steps** — For each step in happy-path order:
   - Title: step number + name (from state identifier, title-cased) + primary trigger
   - Description: what happens, state transition info
   - Source reference: file:line range, handler/view function names
   - Mockup: platform-appropriate format (see OutputFormat.md Mockup Format section)
   - Interaction table: every interaction available at this step
   - Notes: conditional behavior, async operations, edge cases

3. **Footer** — Generate reference tables:
   - All interactions table: every interaction across all steps
   - Escape paths table: from/trigger/destination for all backward navigation
   - Related workflows: link to other walkthroughs that connect

### Mockup Generation Rules

Choose the mockup format from `OutputFormat.md` that matches the platform:
- **TUI / CLI:** Format A (ASCII Box) — box-drawing characters, 55 chars width
- **Web:** Format B (HTML Wireframe) — route, semantic HTML sections, form elements
- **Desktop / Mobile:** Format C (Screen Layout) — window chrome, menu bar, platform widgets
- **Complex branching (any platform):** Format D (Mermaid Flow) — state diagram supplement
- **CLI Wizard:** Format E (CLI Prompt) — `?` prompt with choices and descriptions

When creating mockups from view/render function analysis:

1. **Read the view/render function** to understand the layout structure
2. **Map UI components** to the appropriate mockup format's conventions
3. **Show initial state** of the step (what user sees before interacting)
4. **Include all visible elements:** title/header, progress, content area, navigation/actions
5. **Use one format consistently** within a single walkthrough
6. **Validate alignment** — run `bun ~/.claude/tools/AsciiBox.ts validate <output>` to catch jagged right borders

### Step 6: VALIDATE

Check the generated document for completeness and accuracy.

1. **Every step has a mockup** — No step without a platform-appropriate mockup
2. **Transitions are consistent** — Step N's "advance" action matches Step N+1's existence
3. **No interactions missed** — Compare interaction tables against source handler/event dispatch
4. **Escape paths complete** — Every step has documented backward navigation
5. **Source references valid** — File paths and function names match actual code
6. **Conditional steps marked** — Any skippable step has clear condition note
7. **Async steps marked** — Any step with deferred/async work has an indicator
8. **Mockup format consistent** — Same format used throughout the walkthrough

### Step 7: EMIT YAML

Serialize the extracted structure into a YAML walkthrough file following `YAMLSchema.md`.

1. **Create YAML directory** if needed: `.claude/walkthroughs/`
2. **Build the YAML structure** from extracted data:
   - Top-level `walkthrough` key with all metadata fields
   - `type: linear` with `steps` array, or `type: modal` with `sections` array
   - Each step/section gets: `id`, `name`, `primary_trigger`, `description`, `source` (structured), `mockup`/`mockups`, `interactions`
   - Optional fields: `conditional`, `async`, `validation`, `sub_workflow`, `notes`
   - Footer tables: `all_keys` or `all_keys_by_context`, `escape_paths`, `conditional_behavior`, `async_operations`, `related_workflows`, `related_tours`
3. **Write the YAML** to `.claude/walkthroughs/{id}.yaml`
4. **Validate against schema** — check all required fields, type consistency, count accuracy

### Step 8: RENDER

Invoke the `RenderWalkthrough` workflow (see `Workflows/RenderWalkthrough.md`) to transform the YAML into markdown.

1. **Load** the YAML from `.claude/walkthroughs/{id}.yaml`
2. **Validate** schema compliance
3. **Render** deterministically to markdown following rendering rules
4. **Write** to `docs/walkthroughs/{id}.md`
5. **Report to user:** YAML path, markdown path, step count, interaction count, any warnings

---

## Framework-Specific Source Patterns

### TUI Frameworks

#### Go / BubbleTea

**Key dispatch structure:**
```go
func (m model) handleKey(msg tea.KeyMsg) (model, tea.Cmd) {
    // 1. Sub-model interception (if active)
    if m.picker.active {
        m.picker, cmd = m.picker.handleKey(msg)
        return m, cmd
    }
    // 2. Text input mode
    if m.inputActive {
        switch msg.Type {
        case tea.KeyEnter: ...
        case tea.KeyBackspace: ...
        case tea.KeyRunes: m.input += string(msg.Runes)
        }
    }
    // 3. Step-specific dispatch
    switch m.step {
    case stepX: return m.handleXStep(msg)
    }
    // 4. Global keys
    switch msg.String() {
    case "esc": ...
    }
}
```

**View pattern:** `func (m model) View() string` dispatches on `m.step`.

**Async pattern:** Returns `tea.Cmd` (function returning `tea.Msg`), handled in `Update()`.

**Choice items:** `[]choiceItem{{Label, Value, Desc}}` — map to radio buttons.

#### Python / Textual

**Key dispatch structure:**
```python
class MyApp(App):
    BINDINGS = [
        Binding("j", "cursor_down", "Down"),
        Binding("enter", "select", "Select"),
        Binding("escape", "back", "Back"),
    ]

    def on_key(self, event: Key) -> None:
        if self.step == Step.SYMBOL:
            self._handle_symbol(event)

    def action_select(self) -> None:
        self.step = Step.next(self.step)
```

**View pattern:** `compose()` builds widget tree, `watch_step()` reacts to state changes.

**Async pattern:** `@work` decorator, `self.run_worker()`, `asyncio` tasks.

#### Rust / Ratatui

**Key dispatch structure:**
```rust
fn handle_key(&mut self, key: KeyEvent) -> Option<Action> {
    match (self.state, key.code) {
        (State::Input, KeyCode::Enter) => { self.state = State::Select; }
        (State::Input, KeyCode::Char(c)) => { self.input.push(c); }
        (State::Select, KeyCode::Char('j')) => { self.cursor += 1; }
        (_, KeyCode::Esc) => { self.go_back(); }
    }
}
```

**View pattern:** `fn draw(&mut self, frame: &mut Frame)` with `match self.state`.

**Async pattern:** `tokio::spawn`, `mpsc` channels, `Action` enum for deferred work.

#### JS / Ink (React for CLI)

**Key dispatch structure:**
```jsx
const App = () => {
    const [step, setStep] = useState('symbol');

    useInput((input, key) => {
        if (step === 'symbol') {
            if (key.return) setStep('side');
            else setSymbol(s => s + input);
        }
        if (step === 'side') {
            if (input === 'j') setCursor(c => c + 1);
            if (key.return) setStep('type');
        }
        if (key.escape) goBack();
    });

    return <Box flexDirection="column">
        {step === 'symbol' && <SymbolInput />}
        {step === 'side' && <SideSelect />}
    </Box>;
};
```

**View pattern:** JSX conditional rendering based on state.

**Async pattern:** `useEffect`, `async` handlers, `Promise`.

#### Blessed (Node.js)

**Key dispatch structure:**
```js
screen.key(['j', 'down'], () => list.down(1));
screen.key(['k', 'up'], () => list.up(1));
screen.key('enter', () => advance());
screen.key('escape', () => goBack());
```

**View pattern:** Imperative widget creation + `screen.render()`.

### Web Frameworks

#### React (Next.js / Remix / SPA)

**State management patterns:**
```jsx
// Local state wizard
const [step, setStep] = useState(0);
const steps = [ShippingForm, PaymentForm, ConfirmOrder];
const StepComponent = steps[step];

// URL-based wizard (Next.js App Router)
// /checkout/[step]/page.tsx
export default function CheckoutStep({ params }) { ... }

// Form actions (Remix / Next.js Server Actions)
export async function action({ request }) {
    const formData = await request.formData();
    return redirect('/checkout/payment');
}
```

**Interaction patterns:**
- `onClick`, `onSubmit`, `onChange`, `onBlur` handlers on JSX elements
- `useRouter().push()` / `navigate()` for route transitions
- `useForm()` / `useFormState()` for form state management
- `useMutation()` for async submit + loading states

**View pattern:** JSX return with conditional rendering or route-based pages.

**Async pattern:** `useQuery`/`useMutation` (TanStack), `useSWR`, server actions, `useTransition`.

#### Vue / Nuxt

**State management patterns:**
```vue
<script setup>
const step = ref(0);
const router = useRouter();

function nextStep() {
    if (step.value < steps.length - 1) step.value++;
    else router.push('/checkout/confirm');
}
</script>
```

**Interaction patterns:** `@click`, `@submit.prevent`, `v-model`, `$emit` for child-parent.

**View pattern:** `<template>` with `v-if`/`v-show` per step.

#### Svelte / SvelteKit

**State management patterns:**
```svelte
<script>
let step = $state('shipping');
import { goto } from '$app/navigation';
</script>

{#if step === 'shipping'}
    <ShippingForm on:next={() => step = 'payment'} />
{/if}
```

**Interaction patterns:** `on:click`, `on:submit|preventDefault`, `bind:value`, `$effect`.

### Desktop Frameworks

#### Electron

**IPC-based dispatch:**
```js
// Main process
ipcMain.handle('wizard:next', async (event, data) => {
    const validated = await validate(data);
    return { step: validated.nextStep, errors: validated.errors };
});

// Renderer
const result = await ipcRenderer.invoke('wizard:next', formData);
if (result.errors) showErrors(result.errors);
else setStep(result.step);
```

**View pattern:** HTML/React/Vue renderer per window. Multi-window via `new BrowserWindow()`.

#### SwiftUI

**State-driven dispatch:**
```swift
struct OnboardingView: View {
    @State private var step: Step = .welcome

    var body: some View {
        switch step {
        case .welcome: WelcomeView(onNext: { step = .profile })
        case .profile: ProfileView(onNext: { step = .prefs })
        case .prefs: PrefsView(onDone: { dismiss() })
        }
    }
}
```

**Interaction patterns:** `Button(action:)`, `.onSubmit`, `.onTapGesture`, keyboard shortcuts via `.keyboardShortcut()`.

**Async pattern:** `Task { await ... }`, `@MainActor`, `AsyncSequence`.

### Mobile Frameworks

#### Flutter

**Navigator-based dispatch:**
```dart
class CheckoutFlow extends StatefulWidget {
    @override State<CheckoutFlow> createState() => _CheckoutFlowState();
}

class _CheckoutFlowState extends State<CheckoutFlow> {
    int _step = 0;

    void _nextStep() => setState(() => _step++);

    @override Widget build(BuildContext context) {
        return Stepper(
            currentStep: _step,
            onStepContinue: _nextStep,
            steps: [
                Step(title: Text('Shipping'), content: ShippingForm()),
                Step(title: Text('Payment'), content: PaymentForm()),
            ],
        );
    }
}
```

**Interaction patterns:** `onPressed`, `onTap`, `onSubmitted`, `onChanged`, gesture detectors.

**Async pattern:** `Future`, `FutureBuilder`, `StreamBuilder`, `async`/`await`.

#### React Native

**Navigation-based dispatch:**
```jsx
function CheckoutNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Shipping" component={ShippingScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Confirm" component={ConfirmScreen} />
        </Stack.Navigator>
    );
}

// In ShippingScreen
navigation.navigate('Payment', { address: formData });
```

**Interaction patterns:** `onPress`, `onSubmitEditing`, `onChangeText`, gesture handlers via `react-native-gesture-handler`.

### CLI Wizard Frameworks

#### Inquirer.js / Enquirer

**Sequential prompt dispatch:**
```js
const answers = await inquirer.prompt([
    { name: 'name', type: 'input', message: 'Project name?', validate: v => v.length > 0 },
    { name: 'lang', type: 'list', message: 'Language?', choices: ['Go', 'Rust', 'Python'] },
    { name: 'features', type: 'checkbox', message: 'Features?', choices: ['auth', 'db', 'api'] },
    { name: 'confirm', type: 'confirm', message: 'Create project?', default: true },
]);
```

**Interaction types:** `input` (text), `list` (select), `checkbox` (multi-select), `confirm` (Y/N), `password`, `editor`.

**Conditional steps:** `when: (answers) => answers.lang === 'Go'` skips prompt conditionally.

#### Go / Survey (promptui)

**Sequential prompt dispatch:**
```go
qs := []*survey.Question{
    {Name: "name", Prompt: &survey.Input{Message: "Project name?"}},
    {Name: "lang", Prompt: &survey.Select{Message: "Language?", Options: []string{"Go", "Rust"}}},
    {Name: "confirm", Prompt: &survey.Confirm{Message: "Create project?"}},
}
survey.Ask(qs, &answers)
```

### Generic / Unknown Framework

When the framework isn't recognized:

1. Search for `switch`/`case`, `match`, or `if`/`else if` chains that compare against input/key/event values
2. Look for state variables (`step`, `state`, `mode`, `phase`, `screen`, `page`) used in conditionals
3. Find functions that produce UI output (return strings, render components, build widget trees)
4. Look for event patterns: `.on("key", ...)`, `addEventListener`, `onClick`, `@click`, `on:click`, `onPressed`
5. Search for routing/navigation: route definitions, `navigate()`, `push()`, `redirect()`
6. Look for form handling: `onSubmit`, `handleSubmit`, `formAction`, validation logic

---

## Handling Complex Workflows

### Multi-Phase Steps

Some steps have internal sub-phases. Document as Step N.a, N.b:

```markdown
## Step 2a: Risk Tolerance Slider — `left`/`right` + `enter`
## Step 2b: Risk Profile Selection — `j`/`k` + `enter`
```

### Dense Key Surfaces

For workflows with 30+ keys, group by function:

```markdown
## Navigation Keys
## Indicator Keys
## Mode Keys
## View Keys
```

### Sub-Model / Child Component Workflows

Document as nested walkthrough within the parent:

```markdown
## Step: Symbol Picker — `s`
> Sub-workflow: opens symbol picker overlay within chart tab

### Picker Step 1: Type Search Query
### Picker Step 2: Select from Results
### Picker Step 3: Confirm Selection
```
