var JwReminder = React.createClass({
  getInitialState: function() {
    return {
      open: false
    };
  },

  toggle: function(e) {
    if (e) {
      e.preventDefault();
    }

    this.setState({
      open: !this.state.open
    });
  },

  // Renders the timer dropdown
  renderDropdown: function() {
    if (this.state.open) {
      return (
        React.createElement('div', { className: "open dropdown--arrow-right menu__dropdown dropdown--big" },
          React.createElement('div', { className: "dropdown__body" })
        )
      );
    }
  },

  render: function() {
    return (
      React.createElement('div', {},
        React.createElement('a', { href: "#", onClick: this.toggle }),
        this.renderDropdown()
      )
    );
  }
});
