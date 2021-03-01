# Things to Change

* Make single roots.
* Disable parent variable params.

# Design Decisions

## Event Handlers and Parameters

I'm running into an issue with event handlers on components. When I have many buttons, I may want them all to call the same function, but with different parameters. Those parameters might be strings, numbers, or booleans. The question is, how do I allow it?

Right now there are no parameters passed, and the entire onwhatever attribute value is used as the function name to look up. But what if instead I allowed the user to put JavaScript in there? Then I would eval it in the 'this' context. This would allow more things to be in there. It would be a little tricky, though, because then the child component itself couldn't pass its own parameters in. Is there a way to allow custom JavaScript and allow the user to pass things in?

I can pass in the component that triggered the event. Then I could have other code that would do different things depending on the component that triggered it. This is what regular JavaScript events do, so I would be in line with regular standards.

I think I'm leaning toward the idea of passing in the component always as the first param:
* It avoids eval and any possible issues with it.
* It makes any more complex logic be in JavaScript and not in the HTML.
* It allows for more complex logic when component events are triggered.
* It allows for components to pass their own params to the event callbacks.
* It allows the paragraph code refactoring below.
* It mirrors regular JavaScript events.

Is there a way I can move all of the callback handler overhead into component? See AbstractButton. I could have a 'registerEvent(name)' function and a 'triggerEvent' function. They would automatically search the
params.eventHandlers, create a saved callback, and then call the callback when 'triggerEvent' is called, along with the triggering component and any additional params in the triggerEvent(...params) call.

## Parent Values in Child Component Attributes

When a component P has a child component C, if C is passed an attribute param A that is a property of P, then one of two things must happen:
* C must be constructed after P is constructed. In this case the value of A will be whatever it is when P has finished its constructor.
* P must manually construct C right after it sets A to the proper value.

In the first case, the P's constructor can't use C, even if C doesn't depend on P, since all child components are constructed after the P's constructor.

In the second case, the value of A that gets passed to C is not clear, and if it depends on an async operation (like a connection to a server), then C may not get constructed for awhile, which can cause issues, because P may want to access C in its constructor or other functions, and it will be unknown if C has been constructed.

If, however, we decide that attribute params can never be properties of parents, then the child components can be created in the base component, and be available to use by the parent constructor.

Any child properties that do depend on the parent can be set by the parent via javascript calls, rather than by attributes. Then, instead of the entire child object's existence being uncertain, just the child's property that depends on the parent is uncertain, dependent on the parent. Those properties of C would have defaults set in C's constructor.

## Multiple Roots or One Root Per Component

I don't see a real need for multiple roots, and having a single root makes things simpler:
* A lot of for loops can be condensed into single statements.
* There will only be one element with the class name, rather than a bunch, which looks a bit odd.
* It's easier to see in the HTML where the components are.

App will need to get body as its root instead of creating a single root.

In practice when using components, I haven't seen a real need for multiple roots.
