# Ddosify Latency Action (WIP)
## Usage

You can now consume the action:

```yaml
name: "Ddosify Latency Testing"

on:
  push:
    branches: [ master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Ddosify Latenct Test
      uses: actions/ddosify-latency-action@v1
      with:
        api_key: ${{ secrets.DDOSIFY_API_KEY }}
        target: "https://app.servdown.com"
```
