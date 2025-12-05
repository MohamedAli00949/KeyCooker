# Key Cooker

Key Cooker is an extension designed to provide the best experience when working with key-value pairs of data (JSON, YAML, JS object, and TS types).

## How to use

Follow the next steps to gain the best experience:

1. Open JSON, YAML, or, JS/TS file.
2. Select key as above image **Or** **Focus** on the property key.
3. Click `Ctrl` + `Shift` + `C`
   <br>
   **Or**
   <br>
   Open context menu and click `Copy key path` option
   <br>
   **Or**
   <br>
   Open Command palette (using view menu or click `Ctrl` + `Shift` + `P`) and search about `Copy key path` and click it.
4. Click `Ctrl` + `V` (based on your settings) to past the copied key.

### How to copy selected key at JSON/YAML

![how to copy selected key at JSON/YAML files](/images/Copy%20selected%20key%20path.gif)

### How to copy selected key at JS Object or TS Type

![How to copy selected key at TS and JS](/images/Copy%20selected%20key%20path%20at%20ts,js.gif)

## Features

- Copy selected key path.
  - Copy the key path at JSON file.
  - Copy the key path at YAML file.
  - Copy the key path at JS object.
  - Copy the key path at TS type.
- Copy key path on focus.
- Preview the JSON, YAML, JS objects, and TS types. (coming soon)

## Release Notes

### 0.0.1

- Add copy selected key path.

### 0.0.2

- Support JSONC
- Fix copy return or param prop key
- Test last fixes

### 0.0.3

- Move typescript from `devDependencies` to `dependencies`

### 0.0.4

- Add copy while focusing on prop key

## License

Key Cooker is licensed under the MIT License. For full license details, please refer to the [LICENSE](./LICENSE) file included in this repository.

## Contribution

Key Cooker is an open-source project and welcomes contributions.

- Create a bug/feature [issue](https://github.com/MohamedAli00949/KeyCooker/issues).
