# generalizedtestmanager

A generalized Test manager

## Features

Runs all python files/tests as configured

## Extension Settings

```json
"gtm.folders_to_monitor": [
    {
        "path": "/some/path",
        "runners": [
        {
            "type": "python",
            "executable_path": "/usr/bin/python3",
            "test_files": ["test1.py", "test2.py"],
            "use_python_path": true
        }
        ],
        "evidence_collector": ["collector1", "collector2"],
    }
],
"gtm.evidence_location": "C:\\Evidence"

```

## Known Issues

It's still shit

## Release Notes

### 0.0.1

We can do stuff

### 0.0.2

I fixed a running code issue

### 0.0.3

We can collect any evidence gathered.
Zip it aswell.

### 0.0.4

Version bump for consistency...