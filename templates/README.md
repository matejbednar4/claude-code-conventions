# <Project name>

<Two or three sentences: what this is, who it is for, what it is not.>

## How it works

<The usual path through the system, in the order it runs. Replace with the project's own flow, for example:>

1. <The app calls the API through the SDK.>
2. <A route validates the request; a controller does the work.>
3. <The controller reads and writes the database and answers.>

## Setup

From a fresh clone, in this order. Every command runs from the repo root.

### Prerequisites

- Node `<version>`, yarn `<version>`
- <each other tool or service, with its exact version>

### 1. Install

```bash
yarn install
```

### 2. Environment variables

```bash
cp <backend>/.env.example <backend>/.env
```

<Several backends: one copy line and one table per backend; a backend's file lists only its own variables.>

| Variable | What it is | Where the value comes from |
| --- | --- | --- |
| `<NAME>` | <one line> | <the secret store entry it lives in, or "ask the owner">; never the value itself |

### 3. Database

```bash
<the commands that create and migrate a local database>
```

### 4. Run

```bash
<the command that starts the project, and the address it serves on>
```

## Environments

<Delete this section when there is only one environment.>

| Environment | For | How a change reaches it | Running locally against it |
| --- | --- | --- | --- |
| development | local work | <how> | the default |
| staging | <what is checked there> | <the pipeline> | <how, if allowed> |
| production | real users | the deploy pipeline only | never |

## Commands

```bash
yarn dev                     # <what it starts>
yarn typecheck
yarn lint
yarn test
yarn build
```
