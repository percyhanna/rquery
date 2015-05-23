describe('Test Case', function () {
  var TestUtils = React.addons.TestUtils;

  it('it works', function () {
    var component = TestUtils.renderIntoDocument(React.createElement(JwReminder));
    TestUtils.Simulate.click($R(component).find('a').get(0));
    component = $R(component).get(0);
    expect(component.state.open).to.equal(true);
  });

  it('it also works', function () {
    var component = TestUtils.renderIntoDocument(React.createElement(JwReminder));
    var button = TestUtils.findRenderedDOMComponentWithTag(component, 'a');
    TestUtils.Simulate.click(button);
    expect(component.state.open).to.equal(true);
  });

  it('it doesnt work', function () {
    var component = TestUtils.renderIntoDocument(React.createElement(JwReminder));
    $R(component).find('a').click();
    component = $R(component).get(0);
    expect(component.state.open).to.equal(true);
  });
});
