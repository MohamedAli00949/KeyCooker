# Use Cases

This is the use cases for testing extension.

## Typescript

```ts
// * 1. (passed)
type TestTypes = {
  profiles: {
    users: { names: [string, { target: "target value" }] };
  };
};

// const t: TestTypes["profiles"]["users"]["names"][1]["target"] = "target value";
// The final path to 'target': TestTypes["profiles"]["users"]["names"][1]["target"]
// full path of `target` prop:

// * 1.1 (passed)
type obj = { foo2: string };type obj2 = { foo2: string };
interface objI2 { foo: string; }; interface objI22 {
  foo?: string;
}

// * 1.2. (passed) target: "target", (failed) target: "users"
type TestTypes1 = {
  profiles: {
    usersContainer: [{ users: { names: [string, { target: "target value" }] } }];
  };
};

// const t: TestTypes1["profiles"]["usersContainer"][0]["users"]["names"][1]["target"] = "target value";
// The final path to 'target': TestTypes1["profiles"]["usersContainer"][0]["users"]["names"][1]["target"]

// * 2. (passed)
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

// const tt: TestTypes2["profiles"]["users"]["names"][1]["target"] = "target value";
// the final path to 'target': TestTypes2["profiles"]["users"]["names"][1]["target"]

// * 2.2. (PASSED)
type TestTypes22 = {
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

// * 3. (PASSED)
type TestTypes3 = {
  profiles: {
    users: {
      names: [string, { target: "target value" }];
    };
  };
};
// const test: TestTypes3["profiles"]["users"]["names"][1]["target"] = "target value";
// The final path to 'target': TestTypes3["profiles"]["users"]["names"][1]["target"]

// * 3.3 (passed)
type TestTypes33 = {
  profiles: {
    users: {
      names: [string, { target: "target value" }, { target: "target value 2" }];
    };
  };
};

// const t333: TestTypes33["profiles"]["users"]["names"][2]["target"] = "target value 2";
// The final path to 'target': TestTypes33["profiles"]["users"]["names"][2]["target"]

// * 4. (passed)
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

// const tTestTypes4: TestTypes4["profiles"]["users"]["names"][1]["target"] = "target value";
// The final path to 'target': TestTypes4["profiles"]["users"]["names"][1]["target"]

// * 5. (PASSED)
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
// const namesT5: TestTypes5["profiles"]["users"]["names"] = ["test string"];
// The final path to 'names': TestTypes5["profiles"]["users"]["names"]

// 6. (PASSED)
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

// const usersTest6: TestTypes6["profiles"]["users"]["target"] = "target value";
// The final path to 'target': TestTypes6["profiles"]["users"]["target"]

// 7. (Passed)
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

// 8. (passed) // Alert with `Sorry, this is comment`, target key is "target"
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

// * 8.2 (passed) Alert with `Sorry, this is comment`. target key is "users"
/**
 * type TestTypes8 = {
 *	profiles: {
		users: {
 *			names: [
 *				string,
 *				{ target: "target value";
 *				},
 *			];
 *		};
 * 	};
 * };
 */

// * 8.3 (passed) // target: "child" // typessssTest.parent.child.
const typessssTest = { "parent": { "child": true } };/**
 * type TestTypes8 = {
 *	profiles: {
		users: {
 *			names: [
 *				string,
 *				{ target: "target value";
 *				},
 *			];
 *		};
 * 	};
 * };
 */

// * 8.4 (passed) // target: "child"
const typesssTest = { "parent": { child : true } };/**
 * type TestTypes8 = {
 *	profiles: {
		users: {
 *			names: [
 *				string,
 *				{ target: "target value";
 *				},
 *			];
 *		};
 * 	};
 * };
 */

// * 8.4 (passed) // target: "child", target "target"
const typessTest = { "parent": { child : true } };
type TestTypes8 = {
	profiles: {
    /** sdad aDFS */
		users: {
			names: [
				string,
				{ target: "target value";
				},
			];
		};
	};
};



// * 10. (passed)
const testVarForType22: TestTypes = {
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
// console.log(testVarForType22.profiles.users.names[1].target)
// The final path to 'target': testVarForType22.profiles.users.names[1].target

// * 9. (PASSED)
let var2 = ""; let obj2 = { key: "jkfsj" }; const testVarForType2: {
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
// testVarForType2.profiles.users.names[1].target
// The final path to 'target': testVarForType2.testVarForType2.profiles.users.names[1].target

// * 10  (passed)
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
// console.log(testVarForType.profiles.users.names[1].target);
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
