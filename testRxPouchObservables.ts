import { beautifulJSON } from "./beautifulJSON";
import {
    of, interval,
} from "rxjs";
import {
    catchError,
    concatMap,
    delay,
    concat,
    map,
    pluck,
    take,
    mergeMap
} from "rxjs/operators";
import { rxPouch } from './rxPouch';

// instantiate the class
let z = new rxPouch(
    "http://localhost:5984/tasks", "tasks2"
    // { index: { fields: ["patient_name"] } },
    // { patient_name: "john" }
);

const testPut = (doc: object) => {
    z.putDoc(doc).subscribe(x => {
        console.log(beautifulJSON(x));
    })
}

const testGet = (_id: string) => {
    z.getDoc(_id)

        .pipe(
            catchError((error, caught) => {
                return of(error)
            }))

        .subscribe(x => {
            console.log(beautifulJSON(x));
        })
}

const testDelete = (_ids: Array<string>) => {
    _ids.forEach(element => {
        z.deleteDoc(element)
            .pipe(
                catchError((error, caught) => {
                    return of(error)
                }))
            .subscribe(x => {
                console.log(beautifulJSON(x));
            });
    });
}

const testCreateThenDelete = () => {
    z.putDoc({ name: '*****this one should be deleted in 2 seconds', rank: 'tick tock tick tock' })

        .pipe(
            delay(2000),
            concatMap(doc => {
                // console.log('<===>' + beautifulJSON(doc))
                return z.deleteDoc(doc.id)
            }
            ))

        .subscribe(x => console.log(beautifulJSON(x)))
}

const testMakeWholeBunchThenFindThenDelete = () => {
    interval(1000)
    
    .pipe(
        take(5),
        mergeMap(x => z.putDoc({ name: '*****this one should be deleted in 5 seconds, with his mates', rank: 'tick tock tick tock' })),
        delay(5000),
        map(y => y.id),
        mergeMap(d => z.deleteDoc(d))
    )

    .subscribe(a => console.log(beautifulJSON(a)));
}

const testFindAndDeleteThem = () => {
    // create the index
    z.createIndex({ index: { fields: ['name'] } })
        .pipe(

            concatMap(
                x => {
                    // log the output from the index
                    console.log(beautifulJSON({ "mango index creation output": x }));
                    // now star the find observable
                    return z.findDocs({ selector: { name: { $regex: '^not' } } })
                }),
            // we just want the _ids
            concatMap(y => {
                return (y as Array<any>).map(z => z._id)
            }),
            // now delete all of them
            concatMap(a => z.deleteDoc(a))
        )
        .subscribe(x => console.log(beautifulJSON(x)))
}

// setTimeout(testPut, 500, {
//     name: 'yes another batch of new ones created 500ms after start'
// });

// setTimeout(testCreateThenDelete, 2000);

// setTimeout(testFindAndDeleteThem, 5000)

testMakeWholeBunchThenFindThenDelete();