# Game of Causal Discovery

[Play](https://causaldiscoverygame.vercel.app/)

A causal discovery game where players infer directed causal graphs using observations and do-calculus interventions.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to vercel.com — it auto-deploys on push.

## Project structure

```
src/
├── engine/
│   └── scm.js          # SCM simulator (evaluate, intervene, checkAnswer)
├── levels/
│   ├── index.js        # Level registry
│   ├── level1.js       # 2-var: A → B
│   ├── level2.js       # 3-var chain: A → B → C
│   ├── level3.js       # Fork: B → A, B → C (no observations)
│   ├── level4.js       # Collider: A → C ← B
│   └── level5.js       # 4-var mixed DAG
├── components/
│   ├── CausalNode.jsx  # React Flow node (circle, handles)
│   ├── GraphEditor.jsx # React Flow canvas
│   ├── ObsPanel.jsx    # Left panel: observations
│   ├── IntPanel.jsx    # Left panel: interventions + results
│   └── FeedbackOverlay.jsx  # Correct / wrong modal
└── pages/
    ├── Home.jsx        # Level select
    ├── Game.jsx        # Main game screen
    └── Builder.jsx     # /admin — level builder UI
```

## Adding new levels

**Option A: Use the builder at /admin**
1. Go to `/admin`
2. Set variables, draw edges in the grid, add observations
3. Copy generated code → paste into `src/levels/levelN.js`
4. Adjust SCM probabilities if needed
5. Register in `src/levels/index.js`

**Option B: Write manually**
```json
{
    "id": 1,
    "title": "Level 1",
    "subtitle": "Introduction: Two variables. One cause.",
    "variables": [
        "A",
        "B"
    ],
    "order": [
        "A",
        "B"
    ],
    "observations": [
        "When A is present, B tends to be present.",
        "When A is absent, B is usually absent too."
    ],
    "interventionBudget": 3,
    "scm": {
        "A": {
            "parents": [],
            "pTrue": 0.5
        },
        "B": {
            "parents": [
                "A"
            ],
            "pIfAll": 0.85,
            "pElse": 0.1
        }
    },
    "groundTruth": [
        [
            "A",
            "B"
        ]
    ],
    "hint": "Try intervening on A and watch what happens to B. Then try the other direction.",
    "nodePositions": {
        "A": {
            "x": 100,
            "y": 100
        },
        "B": {
            "x": 200,
            "y": 200
        }
    }
}
```

## SCM notes

- Variables are binary (0 or 1)

## Game rules

- Players see observations (qualitative statements) and draw a directed graph
- They can spend intervention budget to run do(X=v) and see how other variables respond
- Wrong submissions cost 1 intervention attempt
- Level is complete when the submitted graph matches groundTruth exactly
