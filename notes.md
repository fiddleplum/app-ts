# Things to Change

* Make single roots.
* Disable parent variable params.

# Design Decisions

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
