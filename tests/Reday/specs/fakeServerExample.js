describe("SinonFakeServerWithJasmine", function() {
  var server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
  });

  afterEach(function () {
    server.restore();
  });

  it("should fake a jQuery ajax request", function () {
    server.respondWith("GET", "/something",
                       [200, { "Content-Type": "application/json" },
                        '{ "first_name": "Ray", "last_name": "Yahya" }']);

    var callbacks = [sinon.spy(), sinon.spy()];

    jQuery.ajax({
      url: "/something",
      success: callbacks[0]
    });

    jQuery.ajax({
      url: "/other",
      success: callbacks[1]
    });

    console.log(server.requests); // Logs all requests so far
    server.respond(); // Process all requests so far

    expect(callbacks[0].calledOnce).toBeTruthy();
    expect(callbacks[0].calledWith({
      first_name: "Ray",
      last_name: "Yahya"
    })).toBeTruthy();

    expect(callbacks[1].calledOnce).toBeFalsy(); // Unknown URL /other received 404
  });
});