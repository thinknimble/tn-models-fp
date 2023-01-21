import { toSnakeCase } from "@thinknimble/tn-utils"

import CollectionManager from "../src/ts/collectionManager"
import Model, { ToValRepresentation } from "../src/ts/model"
import Pagination from "../src/ts/pagination"

import assert from "assert"
import { describe, it } from "vitest"
import ApiFilter from "../src/ts/apiFilter"
import fields, { BooleanField, CharField, IdField, ModelField } from "../src/ts/fields"

describe("Pagination", function () {
  it("Should create a pagination object with defaults", () => {
    const pagination = Pagination.create()
    assert.equal(pagination.size, 25)
    assert.equal(pagination.totalCount, 0)
    assert.equal(pagination.next, null)
    assert.equal(pagination.previous, null)
    assert.equal(pagination.page, 1)
  })
  it("Should create a pagination object with user defined obj", () => {
    const paginationObj = {
      page: 1,
      totalCount: 1,
      next: null,
      previous: null,
      size: 25,
    }
    const pagination = Pagination.create(paginationObj)
    assert.equal(pagination.size, 25)
    assert.equal(pagination.totalCount, 1)
    assert.equal(pagination.next, null)
    assert.equal(pagination.previous, null)
    assert.equal(pagination.page, 1)
  })
  it("Should have a next page", () => {
    const paginationObj = {
      page: 1,
      totalCount: 26,
      next: null,
      previous: null,
      size: 25,
    }
    const pagination = Pagination.create(paginationObj)
    assert.equal(pagination.hasNextPage, true)
  })
  it("Should have a prev page", () => {
    const paginationObj = {
      page: 2,
      totalCount: 26,
      next: null,
      previous: null,
      size: 25,
    }
    const pagination = Pagination.create(paginationObj)
    assert.equal(pagination.hasPrevPage, true)
  })
  it("Should set the correct nextpage", () => {
    const paginationObj = {
      page: 1,
      totalCount: 26,
      next: null,
      previous: null,
      size: 25,
    }
    const pagination = Pagination.create(paginationObj)
    pagination.setNextPage()
    assert.equal(pagination.page, 2)
  })
  it("Should set the correct prevpage", () => {
    const paginationObj = {
      page: 2,
      totalCount: 26,
      next: null,
      previous: null,
      size: 25,
    }
    const pagination = Pagination.create(paginationObj)
    pagination.setPrevPage()
    assert.equal(pagination.page, 1)
  })
})
describe("CollectionManager", function () {
  it("Should create a collection manager with defaults", () => {
    const collection = CollectionManager.create()
    assert.equal(collection.list.length, 0)
    assert.equal(collection.pagination instanceof Pagination, true)
    assert.equal(collection.refreshing, false)
    assert.equal(collection.loadingNextPage, false)
    assert.equal(Object.keys(collection.filters).length, 0)
  })
})

describe("Model", function () {
  type TPerson = ToValRepresentation<IPerson> & Person
  interface IPerson {
    firstName: CharField
    id: IdField
    lastName: CharField
    bestFriend: ModelField
    allFriends: ModelField[]
    isCool: BooleanField
    isHawt: BooleanField
    isGlam: BooleanField
  }
  class Person extends Model<IPerson> {
    //
    // static api = PersonAPI.create(Person)

    // fields
    static id = new fields.IdField()
    static firstName = new fields.CharField()
    static lastName = new fields.CharField()
    static bestFriend = new fields.ModelField({ ModelClass: Person })
    static allFriends = new fields.ModelField({ ModelClass: Person, many: true })
    static isCool = new fields.BooleanField({ defaultVal: true })
    static isHawt = new fields.BooleanField({ defaultVal: false })
    static isGlam = new fields.BooleanField({})
  }
  // Create a person instance and remove the private '_fields' prop for testing

  interface IReadOnlyPerson {
    id: IdField
    firstName: CharField
  }
  class ReadOnlyPerson extends Model<IReadOnlyPerson> {
    static id = new fields.IdField({ readOnly: true })
    static firstName = new fields.CharField()
  }
  describe("#constructor()", function () {
    it("should have a private `_fields` object with references to the field instances", function () {
      const person = new Person() as TPerson
      const fields = Person.getFields<IPerson>()
      assert.equal(fields["id"], Person.id)
      assert.equal(fields["firstName"], Person.firstName)
      assert.equal(fields["lastName"], Person.lastName)
      console.log(ReadOnlyPerson.getReadOnlyFields())
    })

    it("should have keys for each static property without any args", function () {
      const person = new Person()
      // One for each model field
      assert.equal(Object.keys(person).length, 8)
    })

    it("should set the correct values for fields from args", function () {
      const args = {
        id: "12345",
        firstName: "William",
        lastName: "Hackerman",
        bestFriend: null,
        allFriends: null,
        isCool: false,
        isHawt: false,
        isGlam: false,
      }
      const person = new Person(args)

      // One for each model field
      assert.equal(Object.keys(person).length, 8)

      // See if these are equal (minus the private '_fields' prop)

      assert.equal(JSON.stringify(person), JSON.stringify(args))
    })
  })
  describe("#create()", function () {
    it("should create a person instance with fields for each static property without args", function () {
      const person = Person.create()

      // One for each model field, plus a private '_fields' prop
      assert.equal(Object.keys(person).length, 8)
    })

    it("should create a person instance with correct field values from args", function () {
      const args = {
        id: "12345",
        firstName: "William",
        lastName: "Hackerman",
        bestFriend: null,
        allFriends: null,
        isCool: false,
        isHawt: false,
        isGlam: false,
      }
      const person = Person.create(args)

      // One for each model field, plus a private '_fields' prop

      assert.equal(Object.keys(person).length, 8)

      // See if these are equal (minus the private '_fields' prop)
      assert.equal(JSON.stringify(person), JSON.stringify(args))
    })
  })

  describe("#fromAPI()", function () {
    it("should create a person instance with fields for each static property without args", function () {
      const person = Person.fromAPI()

      // One for each model field, plus a private '_fields' prop
      assert.equal(Object.keys(person).length, 8)
    })

    it("should camelCase args and create a person instance with fields for each static property", function () {
      const args = {
        id: "12345",
        first_name: "William",
        last_name: "Hackerman",
        best_friend: null,
        all_friends: null,
        is_cool: false,
        is_hawt: false,
        is_glam: false,
      }
      const person = Person.fromAPI(args)

      // One for each model field, plus a private '_fields' prop
      assert.equal(Object.keys(person).length, 8)

      // Field names should be mismatched from JSON
      assert.notEqual(JSON.stringify(person), JSON.stringify(args))

      // Field names should now be camelCased
      assert.equal(
        JSON.stringify(person),
        JSON.stringify({
          id: "12345",
          firstName: "William",
          lastName: "Hackerman",
          bestFriend: null,
          allFriends: null,
          isCool: false,
          isHawt: false,
          isGlam: false,
        })
      )
    })

    it("should create nested Person models for friends data", function () {
      const args = {
        id: "12345",
        first_name: "William",
        last_name: "Hackerman",
        best_friend: {
          id: "11111",
          first_name: "Barack",
          last_name: "Obama",
        },
        all_friends: [
          {
            id: "11111",
            first_name: "Barack",
            last_name: "Obama",
          },
        ],
      }

      const person = Person.fromAPI(args) as TPerson

      // One for each model field, plus a private '_fields' prop
      assert.equal(Object.keys(person).length, 8)

      // Field names should be mismatched from JSON
      assert.notEqual(JSON.stringify(person), JSON.stringify(args))

      // Field names should now be camelCased
      assert.equal(
        JSON.stringify(person),
        JSON.stringify({
          id: "12345",
          firstName: "William",
          lastName: "Hackerman",

          bestFriend: {
            id: "11111",
            firstName: "Barack",
            lastName: "Obama",
            bestFriend: null,
            allFriends: null,
            isCool: true,
            isHawt: false,
            isGlam: false,
          },
          allFriends: [
            {
              id: "11111",
              firstName: "Barack",
              lastName: "Obama",

              bestFriend: null,
              allFriends: null,
              isCool: true,
              isHawt: false,
              isGlam: false,
            },
          ],
          isCool: true,
          isHawt: false,
          isGlam: false,
        })
      )
    })
    it("should create a Person Model with boolean values set to default", () => {
      const args = {
        id: "12345",
        firstName: "William",
        lastName: "Hackerman",
        bestFriend: null,
        allFriends: null,
      }
      const person = new Person(args) as TPerson
      assert.equal(true, person.isCool)
      assert.equal(false, person.isHawt)
      assert.equal(false, person.isGlam)
    })
    it("should create a Person Model with boolean values overridden", () => {
      const args1 = {
        id: "12345",
        firstName: "William",
        lastName: "Hackerman",
        bestFriend: null,
        allFriends: null,
        isCool: false,
        isHawt: true,
        isGlam: true,
      }
      const person1 = new Person(args1) as TPerson
      assert.equal(false, person1.isCool)
      assert.equal(true, person1.isHawt)
      assert.equal(true, person1.isGlam)
    })
  })
  describe("helper methods", function () {
    class PersonLastUnique extends Person {
      static lastName = new fields.CharField({ unique: true })
      static bestFriend = new fields.ModelField({ ModelClass: PersonLastUnique })
      static allFriends = new fields.ModelField({ ModelClass: PersonLastUnique, many: true })
    }
    const testPersonDict = {
      first_name: "newfirst",
      last_name: "newlast",
      best_friend: null,
      all_friends: null,
      is_cool: false,
    }
    const testPersonDict1 = {
      first_name: "newfirst1",
      last_name: "newlast1",
      best_friend: null,
      all_friends: null,
      is_cool: false,
    }
    const testPersonFS = {
      first_name: "newfirst2",
      last_name: "newlast2",
      best_friend: null,
      all_friends: [testPersonDict1],
      is_cool: false,
    }
    describe("# new Copy - method to create a brand new copy of a model", () => {
      it("should create a new copy of the entity with new values for any unique fields (id is unique by default)", () => {
        const person = Person.fromAPI(testPersonDict) as TPerson
        const newCopyOfPerson = person.newCopy()
        assert.notEqual(person.id, newCopyOfPerson.id)
      })
      it("should create a new copy of the entity with new value for lastname that is set to unique", () => {
        const person = PersonLastUnique.fromAPI(testPersonDict1) as TPerson
        const newCopyOfPerson = person.newCopy()
        assert.notEqual(person.lastName, newCopyOfPerson.lastName)
      })
      it("should create a new copy of the entity with new value for lastname of parent and nested models that is set to unique", () => {
        const person = PersonLastUnique.fromAPI({
          ...testPersonDict,
          best_friend: testPersonDict1,
        }) as TPerson
        const copyPerson = person.newCopy()
        assert.notEqual(person.bestFriend.lastName, copyPerson.bestFriend.lastName)
      })
      it("should create a new copy of the entity with new value for lastname of parent and nested models that is set to unique", () => {
        const person = PersonLastUnique.fromAPI({ ...testPersonFS }) as TPerson
        const copyPerson = person.newCopy()
        assert.notEqual(person.allFriends[0].lastName, copyPerson.allFriends[0].lastName)
      })
    })
    describe("# duplicate - mehtod to create an exact replica of a model", () => {
      it("should create an exact replica of the entity", () => {
        const person = Person.fromAPI(testPersonDict) as TPerson
        const spreadPerson = person.duplicate()
        assert.equal(person.firstName, spreadPerson.firstName)
      })
      it("should create an exact replica of the entity with a model array", () => {
        const person = Person.fromAPI(testPersonFS) as TPerson
        const spreadPerson = person.duplicate()
        assert.equal(person.allFriends[0].lastName, spreadPerson.allFriends[0].lastName)
      })
      it("should have replica with a different object in memory", () => {
        const person = Person.fromAPI(testPersonDict) as TPerson
        const spreadPerson = person.duplicate()
        person.firstName = "test"
        assert.notEqual(person.firstName, spreadPerson.firstName)
      })
      it("should create an exact replica of the entity with a model array", () => {
        const person = Person.fromAPI(testPersonFS) as TPerson
        const spreadPerson = person.duplicate()
        person.allFriends[0].lastName = "test"
        assert.notEqual(person.allFriends[0].lastName, spreadPerson.allFriends[0].lastName)
      })
      it("should have replica with the same object in memory", () => {
        const person = Person.fromAPI(testPersonDict) as TPerson
        const spreadPerson = person
        person.firstName = "test"
        assert.equal(person.firstName, spreadPerson.firstName)
      })
      it("should be able to apply copy logic to 100 new instances", () => {
        const person = Person.fromAPI(testPersonDict) as TPerson
        let count = 0
        const people: Person[] = []
        while (count <= 99) {
          // create 100 new persons
          people.push(person.newCopy() as TPerson)
          count++
        }
        for (let i = people.length - 1; i >= 0; i--) {
          if (i == 0) {
            person.bestFriend = people[0]
          } else {
            ;(people[i - 1] as TPerson).bestFriend = people[i]
          }
        }
        let iterations = 0
        let friend: null | TPerson = null
        while (iterations <= people.length) {
          if (iterations == 0) {
            friend = person.bestFriend as TPerson
          } else {
            friend = friend ? friend.bestFriend : null
          }
          iterations++
        }
      })
    })

    describe("#toDict", function () {
      const testPersonDict1 = {
        first_name: "newfirst",
        last_name: "newlast",
        best_friend: null,
        all_friends: null,
        is_cool: false,
        is_hawt: true,
        is_glam: true,
      }
      const testPersonDict2 = {
        first_name: "newfirst1",
        last_name: "newlast",
        best_friend: null,
        all_friends: null,
        is_cool: false,
        is_hawt: true,
        is_glam: true,
      }
      const testPersonDict3 = {
        first_name: "newfirst",
        last_name: "newlast",
        best_friend: testPersonDict1,
        all_friends: null,
        is_cool: false,
        is_hawt: true,
        is_glam: true,
      }
      const testPersonDict4 = {
        first_name: "newfirst",
        last_name: "newlast",
        best_friend: null,
        all_friends: [testPersonDict2],
        is_cool: false,
        is_hawt: true,
        is_glam: true,
      }
      const testPersonDict = {
        first_name: "newfirst",
        last_name: "newlast",
        best_friend: null,
        all_friends: null,
        is_cool: false,
        is_hawt: true,
        is_glam: true,
      }
      it("# should return a dictionary representation of a model", () => {
        const person = Person.fromAPI(testPersonDict)
        const personDict = person.toDict()
        Object.entries(personDict).forEach(([k, v]) => {
          if (Object.keys(testPersonDict).includes(toSnakeCase(k))) {
            assert.equal(testPersonDict[toSnakeCase(k)], v)
          }
        })
      })
      it("# should return a dictionary representation of a model including th model field", () => {
        const person = Person.fromAPI(testPersonDict3)
        const personDict = person.toDict()
        Object.entries(personDict).forEach(([k, v]) => {
          if (Object.keys(testPersonDict3).includes(toSnakeCase(k))) {
            if (k != "bestFriend") {
              assert.equal(testPersonDict3[toSnakeCase(k)], v)
            } else {
              Object.entries(personDict["bestFriend"]).forEach(([bk, bv]) => {
                if (Object.keys(testPersonDict3["best_friend"]).includes(toSnakeCase(bk))) {
                  assert.equal(testPersonDict3["best_friend"][toSnakeCase(bk)], bv)
                }
              })
            }
          }
        })
      })
      it("# should return a dictionary representation of a model including th model ARRAY field", () => {
        const person = Person.fromAPI(testPersonDict4)
        const personDict = person.toDict()
        Object.entries(personDict).forEach(([k, v]) => {
          if (Object.keys(testPersonDict4).includes(toSnakeCase(k))) {
            if (k != "allFriends") {
              assert.equal(testPersonDict4[toSnakeCase(k)], v)
            } else {
              personDict["allFriends"].forEach((friend, i) => {
                Object.entries(friend).forEach(([k, v]) => {
                  if (Object.keys(testPersonDict4["all_friends"][i]).includes(toSnakeCase(k))) {
                    assert.equal(testPersonDict4["all_friends"][i][toSnakeCase(k)], v)
                  }
                })
              })
            }
          }
        })
      })
    })
  })
})
describe("ApiFilter", () => {
  describe("#constructor", () => {
    it("should create a new filter using the new keyword", () => {
      const apiFilter = new ApiFilter("test")
      assert.equal(apiFilter.key, "test")
    })
    it("should create a new filter using the create factory dn", () => {
      const apiFilter1 = ApiFilter.create({ key: "testing" })
      assert.equal(apiFilter1.key, "testing")
    })
    it("should build the filter params using the build fn", () => {
      const filter_map = {
        page: ApiFilter.create({ key: "page" }),
        pageSize: ApiFilter.create({ key: "page_size" }),
        name: ApiFilter.create({ key: "name" }),
      }
      const filters = {
        page: 1,
        pageSize: 10,
        name: "test",
      }
      const apiFilterRes = ApiFilter.buildParams(filter_map, filters)
      assert.equal(apiFilterRes.page, 1)
      assert.equal(apiFilterRes.page_size, 10)
      assert.equal(apiFilterRes.name, "test")
    })
    it("should build the filter params using the build remove invalid", () => {
      const filter_map = {
        page: ApiFilter.create({ key: "page" }),
        pageSize: ApiFilter.create({ key: "page_size" }),
        name: ApiFilter.create({ key: "name" }),
      }
      const filters = {
        page: 1,
        pageSize: null,
        name: "test",
      }
      const apiFilterRes = ApiFilter.buildParams(filter_map, filters)
      assert.equal(Object.keys(apiFilterRes).includes("page_size"), false)
    })
  })
})
