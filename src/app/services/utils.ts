export class Optional {
    static ifPresent<Type>(item: Type, consumer: ((i:Type) => void)) {
        if (item) {
            consumer(item);
        }
    }
}