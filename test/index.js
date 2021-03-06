var should = require('should'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseHidden = require('../index')();

describe("mongoose-hidden", function () {
  var averageJoe = { name: "Joe", email: "joe@example.com", password: "secret" };
  var averageMarie = { name: "Marie", email: "marie@example.com", password: "secret" };

  var company = {
    "_id": "5613a1c7e1095d8e71ae90da",
    "name": "GOGGLE",
    "code": "GOG",
  };

  var keyVersion = "__v";
  var keyId = "_id";
  var valuePassword = "secret";

  // Convenience method for creating a new schema, attaching plugin and returning a model object
  var nextModel = function (schemaProperties, pluginOptions) {
    var schema = new Schema(schemaProperties);
    // schema.set('toJSON', { getters: false, virtuals: false });
    schema.plugin(mongooseHidden, pluginOptions);
    return mongoose.model('User' + nextModel.modelCount++, schema);
  };
  nextModel.modelCount = 0;

  before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-hidden', function(err) {
      if (err) {
        console.error('MongoDB: ' + err.message);
        console.error('MongoDB is running? Is it accessible by this application?');
        return done(err);
      }
      mongoose.connection.db.dropDatabase(done);
    });
  });

  after(function (done) {
    mongoose.connection.close(done);
  });

  describe("A model with no hidden properties defined", function () {
    it("Should return all properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: String
      });
      var user = new User(averageJoe);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      userJson.password.should.equal(valuePassword);
      done();
    });
  });

  describe("A model with a hidden properties defined", function () {
    it("Shouldn't return that property", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      var user = new User(averageJoe);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson.password);
      done();
    });
  });

  describe("A model with default hidden properties defined", function () {
    it("Shouldn't return that property", function (done) {
      var User = nextModel({
        keyVersion: String,
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      var user = new User(averageJoe);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson.password);
        should.not.exist(userJson[keyVersion]);
        done();
      });
    });
  });

  describe("Default hiding turned off", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      }, { hide: false });

      var user = new User(averageJoe);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(valuePassword);
        should.exist(userJson[keyVersion]);
        should.exist(userJson[keyId]);
        done();
      });
    });
  });

  describe("Default hiding turned off for JSON only", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      }, { hideJSON: false });

      var user = new User(averageJoe);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(valuePassword);
        should.exist(userJson[keyVersion]);
        should.exist(userJson[keyId]);

        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        should.not.exist(userObject["password"]);
        should.not.exist(userObject[keyVersion]);
        should.not.exist(userObject[keyId]);
        done();
      });
    });
  });

  describe("Default hiding turned off for object only", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      }, { hideObject: false });

      var user = new User(averageJoe);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        userObject.password.should.equal(valuePassword);
        should.exist(userObject[keyVersion]);
        should.exist(userObject[keyId]);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson["password"]);
        should.not.exist(userJson[keyVersion]);
        should.not.exist(userJson[keyId]);
        done();
      });
    });
  });

  describe("Default hiding on, JSON option property", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hideJSON: true }
      });

      var user = new User(averageJoe);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        userObject.password.should.equal(valuePassword);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson["password"]);
        done();
      });
    });
  });

  describe("Default hiding on, object option property", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hideObject: true }
      });

      var user = new User(averageJoe);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        should.not.exist(userObject["password"]);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(valuePassword);
        done();
      });
    });
  });

  describe("Default hiding on, object option property off", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hideObject: false } // basically has no effect unless `true`
      });

      var user = new User(averageJoe);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        userObject.password.should.equal(valuePassword);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(valuePassword);
        done();
      });
    });
  });

  describe("A model with a hidden properties defined using function", function () {
    it("Shouldn't return password property for Joe for both JSON and object", function (done) {
      var testFunction = function (doc, ret) {
        return doc.name === 'Joe';
      }
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hide: testFunction }
      });

      var user = new User(averageJoe);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson.password);
      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      should.not.exist(userObject.password);

      user = new User(averageMarie);
      userJson = user.toJSON();
      userJson.name.should.equal("Marie");
      userJson.email.should.equal("marie@example.com");
      userJson.password.should.equal(valuePassword);
      userObject = user.toJSON();
      userObject.name.should.equal("Marie");
      userObject.email.should.equal("marie@example.com");
      userObject.password.should.equal(valuePassword);

      done();
    });
  });

  describe("A model with a hidden properties defined using function for JSON", function () {
    it("Shouldn't return password property for Joe for only for JSON", function (done) {
      var testFunction = function (doc, ret) {
        return doc.name === 'Joe';
      }
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hideJSON: testFunction }
      });

      var user = new User(averageJoe);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson.password);
      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      userObject.password.should.equal(valuePassword);

      user = new User(averageMarie);
      userJson = user.toJSON();
      userJson.name.should.equal("Marie");
      userJson.email.should.equal("marie@example.com");
      userJson.password.should.equal(valuePassword);
      userObject = user.toObject();
      userObject.name.should.equal("Marie");
      userObject.email.should.equal("marie@example.com");
      userObject.password.should.equal(valuePassword);

      done();
    });
  });

  describe("A model with a hidden properties defined using function for object", function () {
    it("Shouldn't return password property for Joe for only for object", function (done) {
      var testFunction = function (doc, ret) {
        return doc.name === 'Joe';
      }
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hideObject: testFunction }
      });

      var user = new User(averageJoe);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      userJson.password.should.equal(valuePassword);
      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      should.not.exist(userObject.password);

      user = new User(averageMarie);
      userJson = user.toJSON();
      userJson.name.should.equal("Marie");
      userJson.email.should.equal("marie@example.com");
      userJson.password.should.equal(valuePassword);
      userObject = user.toObject();
      userObject.name.should.equal("Marie");
      userObject.email.should.equal("marie@example.com");
      userObject.password.should.equal(valuePassword);

      done();
    });
  });

  describe("A model with password and password set as default hidden", function () {
    it("Shouldn't return password", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: String
      });
      schema.plugin(require('../index')({ defaultHidden: { "password" : true }}));
      var User = mongoose.model('DefaultHiddenUser', schema);
      var user = new User(averageJoe);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson["password"]);
        done();
      });
    });
  });

  describe("A model with password and password set as default hidden overriden with option", function () {
    it("Should return password", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: String
      });
      schema.plugin(require('../index')({ defaultHidden: { "password" : true }}), { defaultHidden: { }});
      var User = mongoose.model('DefaultHiddenUserOverriden', schema);
      var user = new User(averageJoe);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(valuePassword);
        done();
      });
    });
  });

  describe("A model with a virtuals defined", function () {
    it("Shouldn't return that property if option not passed", function (done) {
      var User = nextModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      User.schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var user = new User(averageJoe);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson['niceEmamil']);
      should.not.exist(userJson.password);
      done();
    });

    it("Should return that property if option is passed", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      schema.set('toJSON', { getters: true, virtuals: true });
      schema.plugin(require('../index')());
      schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var User = mongoose.model('VirtualUser', schema);
      var user = new User(averageJoe);
      user.niceEmail.should.equal('"Joe" <joe@example.com>');
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.exist(userJson['niceEmail']);
      userJson.niceEmail.should.equal('"Joe" <joe@example.com>');
      // should.not.exist(userJson['id']);
      should.not.exist(userJson.password);
      done();
    });

    it("Shouldn't return that property even if option is passed", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      schema.set('toJSON', { getters: true, virtuals: true });
      schema.plugin(require('../index')(), { virtuals: { id: 'hide', niceEmail: 'hide' }});
      schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var User = mongoose.model('VirtualUser2', schema);
      var user = new User(averageJoe);
      user.niceEmail.should.equal('"Joe" <joe@example.com>');
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      // should.not.exist(userJson['id']);
      should.not.exist(userJson['niceEmail']);
      should.not.exist(userJson.password);
      done();
    });

    it("Shouldn't return that property even if option is passed, unless object", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      schema.set('toJSON', { getters: true, virtuals: true });
      schema.set('toObject', { getters: true, virtuals: true });
      schema.plugin(require('../index')(), { virtuals: { niceEmail: 'hideObject' }});
      schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var User = mongoose.model('VirtualUser3', schema);
      var user = new User(averageJoe);
      user.niceEmail.should.equal('"Joe" <joe@example.com>');
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.exist(userJson['niceEmail']);
      userJson.niceEmail.should.equal('"Joe" <joe@example.com>');
      should.not.exist(userJson.password);

      userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      should.not.exist(userObject['niceEmail']);
      should.not.exist(userObject.password);
      done();
    });
  });

  // Ticket: https://github.com/mblarsen/mongoose-hidden/issues/1
  describe("A document with nested documents when hiding", function () {
    it("Shouldn't remove it's nested documents", function (done) {
      var companySchema = new Schema({
        name: String,
        code: String,
      });
      var Company = mongoose.model('Company', companySchema);
      var companyInstance = new Company(company);

      var userSchema = new Schema({
        name: String,
        email: String,
        company: { type: Schema.ObjectId, ref: 'Company' },
        password: { type: String, hide: true }
      });
      userSchema.plugin(mongooseHidden);
      var User = mongoose.model('CompanyMan', userSchema);
      var user = new User(averageJoe);

      companyInstance.save(function() {
        user.company = companyInstance._id;
        user.save(function() {
          User.findOne().populate('company').exec(function (err, freshUser) {
            should.exist(freshUser.company);
            freshUser.company.name.should.equal('GOGGLE');
            userJson = freshUser.toJSON();
            should.not.exist(userJson.password);
            should.exist(userJson.company);
            should.equal("GOGGLE", userJson.company.name);
            done();
          });
        });
      });
    });
  });

  describe("A model with a transform", function () {
    it("Should transform", function (done) {
      var userSchema = new Schema({
        name: String,
        password: { type: String, hide: true }
      });

      userSchema.set('toJSON', { transform: function (doc, ret, opt) {
        ret['name'] = 'Mr. ' + ret['name'];
        return ret;
      }});

      var User = mongoose.model('MrCompanyMan', userSchema);
      var user = new User(averageJoe);

      var userJson = user.toJSON();
      userJson.name.should.equal("Mr. Joe");
      userJson.password.should.equal(valuePassword);
      done();
    });
    it("Should still transform after adding plugin", function (done) {
      var userSchema = new Schema({
        name: String,
        password: { type: String, hide: true }
      });

      userSchema.set('toJSON', { transform: function (doc, ret, opt) {
        ret['name'] = 'Mr. ' + ret['name'];
        return ret;
      }});

      userSchema.plugin(mongooseHidden);

      var User = mongoose.model('AnotherMrCompanyMan', userSchema);
      var user = new User(averageJoe);

      var userJson = user.toJSON();
      userJson.name.should.equal("Mr. Joe");
      should.not.exist(userJson.password);
      done();
    });
  });
});
