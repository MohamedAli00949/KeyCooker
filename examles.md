# Use Cases
This is the use cases for testing extension.

## Typescript

```ts
type TestTypes = {
	profiles: {
		users: {
			names: [
				string,
				{
					kjkljdfs: "kjdfsfldj";
				},
			];
		};
	};
};

const testVarForType: TestTypes = {
	profiles: {
		users: {
			names: [
				"string",
				{
					kjkljdfs: "kjdfsfldj",
				},
			],
		},
	},
};

console.log(testVarForType["profiles"]["users"]["names"][1]["kjkljdfs"]);
console.log(testVarForType.profiles.users.names[1].kjkljdfs);
console.log(testVarForType.profiles.users.names["1"].kjkljdfs);

const testVar: TestTypes["profiles"]["users"]["names"][0] = "sfds";
```

## JSON

```json
{
	"title": "Key cooker",
	"features": {
		"languates": [
			"json",
			"yaml",
			"javascript",
			"javascriptreact",
			"typescript",
			"typescriptreact"
		],
		"json": {
			"path-shape": "path.obj.prop.name"
		},
		"yaml": {
			"path-shape": "path.obj.prop.name"
		},
		"javascript": {
			"path-shapes": {
				"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"kjkljdfs\"]",
				"num-square-brackets": "testVarForType.profiles.users.names[1].kjkljdfs"
			}
		},
		"javascriptreact": {
			"path-shapes": {
				"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"kjkljdfs\"]",
				"num-square-brackets": "testVarForType.profiles.users.names[1].kjkljdfs"
			}
		},
		"typescript": {
			"path-shapes": {
				"obj": {
					"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"kjkljdfs\"]",
					"num-square-brackets": "testVarForType.profiles.users.names[1].kjkljdfs"
				},
				"type": "TestTypes[\"profiles\"][\"users\"][\"names\"][0]"
			}
		},
		"typescriptreact": {
			"path-shapes": {
				"obj": {
					"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"kjkljdfs\"]",
					"num-square-brackets": "testVarForType.profiles.users.names[1].kjkljdfs"
				},
				"type": "TestTypes[\"profiles\"][\"users\"][\"names\"][0]"
			}
		}
	}
}
```
