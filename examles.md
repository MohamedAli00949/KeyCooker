# Use Cases

This is the use cases for testing extension.

## Typescript

```ts
// 1.
type TestTypes = {
	profiles: {
		users: { names: [string, { target: "target value" }] };
	};
};

// 2.
type TestTypes1 = {
	profiles: {
		usersContainer: [
			{ users: { names: [string, { target: "target value" }] } },
		];
	};
};

// 3.
type TestTypes2 = {
	profiles: {
		users: {
			names: [
				string,
				{
					target: "target value";
				},
			];
		};
	};
};

// 4.
type TestTypes3 = {
	profiles: {
		users: {
			names: [string, { target: "target value" }];
		};
	};
};

// 5.
type TestTypes4 = {
	profiles: {
		users: {
			names: [
				string,
				{
					target: "target value";
				},
			];
		};
	};
};

// 6.
type TestTypes5 = {
	profiles: {
		users: {
			names: [
				string,
				// {
				// 	target: "target value";
				// },
			];
		};
	};
};

// 7.
type TestTypes6 = {
	profiles: {
		users: {
			// names: [
			// string,
			// {
			target: "target value";
			// },
			// ];
		};
	};
};

// 8.
type TestTypes7 = {
	profiles: {
		// type
		users: {
			// names: [
			// string,
			// {
			target: "target value";
			// },
			// ];
		};
	};
};

// 9.
/**
 * type TestTypes8 = {
 *	profiles: {
 *		users: {
 *			names: [
 *				string,
 *				{ target: "target value";
 *				},
 *			];
 *		};
 * 	};
 * };
 */

// 10.
const testVarForType22 = {
	profiles: {
		users: {
			names: [
				"string",
				{
					target: "target value",
				},
			],
		},
	},
};

// 11.
let var2 = "";
let obj2 = { key: "jkfsj" };
const testVarForType2: {
	profiles: {
		users: {
			names: [
				string,
				{
					target: "target value";
				},
			];
		};
	};
} = {
	profiles: {
		users: {
			names: [
				"string",
				{
					target: "target value",
				},
			],
		},
	},
};

// 12.
const testVarForType: TestTypes = {
	profiles: {
		users: {
			names: [
				"string",
				{
					target: "target value",
				},
			],
		},
	},
};
```

## JSON

```json
{
	"title": "Key cooker",
	"features": {
		"languages": [
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
				"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"target\"]",
				"num-square-brackets": "testVarForType.profiles.users.names[1].target"
			}
		},
		"javascriptreact": {
			"path-shapes": {
				"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"target\"]",
				"num-square-brackets": "testVarForType.profiles.users.names[1].target"
			}
		},
		"typescript": {
			"path-shapes": {
				"obj": {
					"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"target\"]",
					"num-square-brackets": "testVarForType.profiles.users.names[1].target"
				},
				"type": "TestTypes[\"profiles\"][\"users\"][\"names\"][0]"
			}
		},
		"typescriptreact": {
			"path-shapes": {
				"obj": {
					"full-square-brackets": "testVarForType[\"profiles\"][\"users\"][\"names\"][1][\"target\"]",
					"num-square-brackets": "testVarForType.profiles.users.names[1].target"
				},
				"type": "TestTypes[\"profiles\"][\"users\"][\"names\"][0]"
			}
		}
	}
}
```
