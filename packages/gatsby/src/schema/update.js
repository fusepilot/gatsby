const _ = require(`lodash`)
const { GraphQLSchema, GraphQLObjectType } = require(`graphql`)
const buildNodeTypes = require(`./build-node-types`)
const buildNodeConnections = require(`./build-node-connections`)
const { store } = require(`../redux`)

module.exports = async () => {
  const typesGQL = await buildNodeTypes()
  const connections = buildNodeConnections(_.values(typesGQL))
  const nodes = _.mapValues(typesGQL, `node`)

  // get the old schema from the store
  const oldSchema = store.getState().schema

  // generate new schema with only the updated stuff we care about
  const updateSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: `RootQueryType`,
      fields: {
        sitePage: nodes.sitePage,
        allSitePage: connections.allSitePage,
      },
    }),
  })

  // clone the old schema
  const newSchema = Object.assign(
    Object.create(Object.getPrototypeOf(oldSchema)),
    oldSchema
  )

  // merge in the updated types and fields
  newSchema._typeMap.SitePage = updateSchema._typeMap.SitePage
  newSchema._queryType._fields.sitePage =
    updateSchema._queryType._fields.sitePage
  newSchema._queryType._fields.allSitePage =
    updateSchema._queryType._fields.allSitePage

  // replace the store with the new schema
  store.dispatch({
    type: `SET_SCHEMA`,
    payload: newSchema,
  })
}
