const schema = {
    type: 'object',
    properties:{
        body:{
            type: 'string',
            minLength: 1,
            pattern: '\=$' //pattern to check whether url string is base 64. Base64 always ends with =
        }
    },
    required: ['body']
};

export default schema;