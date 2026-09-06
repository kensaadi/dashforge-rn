import type {
  Ask,
  DialogComponent,
  DialogPropsOf,
  DialogResultOf,
} from './dialog.types';

/**
 * The contract, checked by the compiler.
 *
 * There is no implementation yet on purpose: the inference is the part
 * that either works or does not, and an `ask` returning `string | null`
 * where it should return `'save' | 'cancel' | null` is worth finding
 * before a host exists to make it expensive to change.
 *
 * **Nothing here runs.** The declarations have no runtime value, so the
 * checks live in functions nobody calls: `tsc` is the test, and Jest is
 * only here to notice that the file still compiles.
 */

/** Fails to compile unless `Actual` is exactly `Expected`. */
type Exact<Actual, Expected> = [Actual] extends [Expected]
  ? [Expected] extends [Actual]
    ? true
    : false
  : false;

declare const proves: <T extends true>(claim: T) => void;

// --- the registry an app would write -----------------------------------

interface Address {
  street: string;
  city: string;
}

type PickAddress = DialogComponent<{ userId: string }, Address>;
/** A dialog that answers nothing: it does its work and closes. */
type EditProfile = DialogComponent<{ id: number }>;

interface Registry {
  pickAddress: PickAddress;
  editProfile: EditProfile;
}

declare const ask: Ask<Registry>;

// --- a question --------------------------------------------------------

async function anAnswerIsNarrowedToWhatWasOffered() {
  const answer = await ask({
    title: 'Vuoi salvare?',
    message: 'Le modifiche non salvate andranno perse.',
    actions: [
      { value: 'cancel', label: 'Annulla', variant: 'ghost' },
      { value: 'save', label: 'Salva' },
    ],
  });

  // Not `string | null`: the caller gets the union it wrote, with no
  // `as const` at the call site and no type declared anywhere.
  proves<Exact<typeof answer, 'cancel' | 'save' | null>>(true);
}

async function nullIsNotConfusableWithAnAnswer() {
  const answer = await ask({
    title: 'Uscire?',
    actions: [{ value: 'leave', label: 'Esci' }],
  });

  if (answer === null) proves<Exact<typeof answer, null>>(true);
  else proves<Exact<typeof answer, 'leave'>>(true);
}

// --- a registered dialog -----------------------------------------------

function propsAreTheOnesTheComponentWantsMinusTheHostS() {
  proves<Exact<DialogPropsOf<PickAddress>, { userId: string }>>(true);
}

function theResultIsReadOffTheCloseProp() {
  // From the prop and not from a second type parameter, because an
  // intersection cannot be split back apart.
  proves<Exact<DialogResultOf<PickAddress>, Address>>(true);
}

async function aRegisteredDialogResolvesWhatItsCloseAccepts() {
  const chosen = await ask({ dialog: 'pickAddress', props: { userId: 'u1' } });
  proves<Exact<typeof chosen, Address | null>>(true);
}

async function aDialogThatAnswersNothingResolvesVoid() {
  const done = await ask({ dialog: 'editProfile', props: { id: 1 } });
  proves<Exact<typeof done, void | null>>(true);
}

// --- what the compiler refuses -----------------------------------------

function refusals() {
  // @ts-expect-error 'nope' is not in the registry
  void ask({ dialog: 'nope', props: {} });

  // @ts-expect-error pickAddress wants a userId, not an orderId
  void ask({ dialog: 'pickAddress', props: { orderId: 1 } });

  // @ts-expect-error `actions` is not optional: a question with no
  // answers is a message, and a message is not this component's job.
  void ask({ title: 'Ciao' });
}

it('is a compile-time contract, and it still compiles', () => {
  // The checks above are the test. Referencing them keeps them from
  // being pruned as dead code by anything that might try.
  expect(
    [
      anAnswerIsNarrowedToWhatWasOffered,
      nullIsNotConfusableWithAnAnswer,
      propsAreTheOnesTheComponentWantsMinusTheHostS,
      theResultIsReadOffTheCloseProp,
      aRegisteredDialogResolvesWhatItsCloseAccepts,
      aDialogThatAnswersNothingResolvesVoid,
      refusals,
    ].length,
  ).toBe(7);
});
