// https://odyssey.apollographql.com/lift-off-part2/implementing-query-resolvers
// ---------------------------------------------------------------------------------

// A resolver's mission is to populate the data for a field in your schema. YOUR mission is to impoement those resolvers
// A resolver is a function. It has the SAME NAME as the field that it populates data for. It can fetch data from any data source, then transforms that data into the shape your client requires.
// resolver function names must match the field name in the schema
// the Query and Mutation types in the schema should have corresponding keys in the resolvers object

// Resolver functions have a specific signature with 4 optional parameters:

// - -  Parent: the returned value of the resolver for this field's parent. this will be useful when dealing with resolver chains

// - -  Args: Is an object that contains all GraphQL arguments that were provided for the field by the GraphQL operation. When querying for a specific item (such as a specific track instead of ALL tracks), in client-land we'll make a query with an id qrgument that will be accessible via this 'args' parameter in server-land.

// - -  Context: is an object shared across all resolvers that are executed for a particular operation. the resolver needs this context argument to share state, like authentication information, a database connection, or in our case the RESTDataSource.

// - -- Info: contains information about the operation's execution state, including the field name, the path to the field from the root, and more. It's not used as frequently as the others, but it can be useful for more advanced actions like setting cache policies at the resolver level.

// As a best practice, when working on your resolvers and data sources, try to keep resolver functions as thin as possible. By doing so, you make your API more resilient to future changes. You can safely refactor your data fetching code, or change the source entirely from a REST API to a database, without breaking your API. This also keeps your resolvers readable and easier to understand, which comes in handy as you define more and more of them!

const resolvers = {
  Query: {
    // returns an array of Tracks that will be used to populate the homepage grid of our web client
    // if we aren't using all 4 paremeters, we use underscores for the names
    // ORIGINAL: tracksForHome: (parent, args, context, info) => {
    // but instead here we only need our context information, so we _ for the first two, and drill into our context to get our dataSources
    tracksForHome: (_, __, { dataSources }) => {
      return dataSources.trackAPI.getTracksForHome();
    },
    // our destructured dataSources from context is where our trackAPI.getTrack method lives. This method is expecting the id of a track.
    // to access this id, we can use the second parameter, args, which is an object that contains all GraphQL arguments, and can be destructured to access the id property
    // get a single track by id, for the Track page
    track: (_, { id }, { dataSources }) => {
      return dataSources.trackAPI.getTrack(id);
    },
    module: (_, { id }, { dataSources }) => {
      return dataSources.trackAPI.getModule(id);
    },
  },

  Mutation: {
    // https://odyssey.apollographql.com/lift-off-part4/resolving-a-mutation-successfully
    // increment's a track's numberOfViews property
    // can't immediately return the results of the TrackAPI, as this builds part of the response from the REST operation status, as well as the schema also expecting code, success, and message fields.
    incrementTrackViews: async (_, { id }, { dataSources }) => {
      try {
        const track = await dataSources.trackAPI.incrementTrackViews(id);

        return {
          code: 200,
          success: true,
          message: `Successfully incremented number of views for track ${id}`,
          track,
        };
      } catch (err) {
        // Here is our error handling
        // It helps us make our response object fields more dynamic
        return {
          code: err.extensions.response.status,
          success: false,
          message: err.extensions.response.body,
          track: null,
        };
      }
    },
  },

  Track: {
    // track type in our schema
    // this time we'll need the parent argument, so let's keep it in the resolver function. we can replace args, and destructure context to access the dataSources
    // we'll get the authorId from the parent argument passed to the resolver.  The parent argument contains data returned by our tracksForHome resolver, and because tracksForHome returns a list, Apollo Server iterates through that list and calls the author resolver once for each tracck. It passes the current track as the value of parent, enabling us to extrac the authorId.
    author: ({ authorId }, _, { dataSources }) => {
      return dataSources.trackAPI.getAuthor(authorId);
    },
    modules: ({ id }, _, { dataSources }) => {
      return dataSources.trackAPI.getTrackModules(id);
    },

    durationInSeconds: ({ length }) => length,
  },
  Module: {
    durationInSeconds: ({ length }) => length,
  },
};

module.exports = resolvers;
