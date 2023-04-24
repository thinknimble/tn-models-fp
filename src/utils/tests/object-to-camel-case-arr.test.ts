import { describe, expect, it } from "vitest"
import { objectToCamelCaseArr } from "../api"

describe("objectToCamelCaseArr", () => {
  const singleElement = {
    test_snake: 5,
    test_snake_other: 9,
  }
  it("properly handles single array value", () => {
    //arrange
    const inputArray = [singleElement]
    //act
    const result = objectToCamelCaseArr(inputArray)
    //assert
    expect(result).toEqual([
      {
        testSnake: singleElement.test_snake,
        testSnakeOther: singleElement.test_snake_other,
      },
    ])
  })
  it("properly handles an object with an array within", () => {
    //arrange
    const testObj = {
      my_array_field: [singleElement, singleElement],
    }
    //act
    const result = objectToCamelCaseArr(testObj)
    // assert
    expect(result).toEqual({
      myArrayField: [
        { testSnake: 5, testSnakeOther: 9 },
        { testSnake: 5, testSnakeOther: 9 },
      ],
    })
    //TODO:
  })
  it("properly handles an object with more than one field that is an array", () => {
    //arrange
    const testObj = {
      my_array_field: [singleElement, singleElement],
      my_array_field_other: [singleElement],
    }
    //act
    const result = objectToCamelCaseArr(testObj)
    // assert
    expect(result).toEqual({
      myArrayField: [
        { testSnake: 5, testSnakeOther: 9 },
        { testSnake: 5, testSnakeOther: 9 },
      ],
      myArrayFieldOther: [{ testSnake: 5, testSnakeOther: 9 }],
    })
  })
  it("properly handles an object with nested arrays", () => {
    //arrange
    const my_nested_array = [
      {
        nested_value: 10,
      },
    ]

    const testObj = {
      my_array_field: [
        {
          my_nested_array,
        },
      ],
    }
    //act
    const result = objectToCamelCaseArr(testObj)
    // assert
    expect(result).toEqual({
      myArrayField: [
        {
          myNestedArray: [
            {
              nestedValue: 10,
            },
          ],
        },
      ],
    })
  })

  it("handles a super nested array", () => {
    //arrange
    const createSuperNestedArrayWithClosure = (deepObject: any, levels: number) => {
      let currentLevel = levels
      const mainArray: any[] = []
      let lastLevel = mainArray
      while (currentLevel !== 0) {
        lastLevel[0] = []
        if (currentLevel === 1) {
          lastLevel[0] = deepObject
        } else {
          lastLevel = lastLevel[0]
        }
        currentLevel--
      }
      return mainArray
    }

    const testTwoLevels = createSuperNestedArrayWithClosure(singleElement, 2)
    const resultTwoLevels = objectToCamelCaseArr(testTwoLevels)
    const testFiveLevels = createSuperNestedArrayWithClosure(singleElement, 5)
    const resultFiveLevels = objectToCamelCaseArr(testFiveLevels)
    const expectedDeepObject = {
      testSnake: 5,
      testSnakeOther: 9,
    }
    2

    //act
    expect(resultTwoLevels).toEqual(createSuperNestedArrayWithClosure(expectedDeepObject, 2))
    expect(resultFiveLevels).toEqual(createSuperNestedArrayWithClosure(expectedDeepObject, 5))
  })
})
