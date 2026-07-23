import { FilterQuery } from "mongoose";
import { Query } from "mongoose";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;
  public total: number;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
    this.total = 0;
  }

  search(searchableFields: string[]) {
    if (this.query?.searchTerm) {
      this.modelQuery = this?.modelQuery?.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: this.query?.searchTerm, $options: "i" },
            } as FilterQuery<T>)
        ),
      });
    }

    return this;
  }

  filter(excludeFields: string[]) {
    const queryObj = { ...this.query };
    excludeFields.forEach((el) => delete queryObj[el]);

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

    return this;
  }

  sort() {
    const sort = this?.query?.sort || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort as string);
    return this;
  }

  async countTotal() {
    this.total = await this.modelQuery.clone().countDocuments();
    this.modelQuery = this.modelQuery;
    return this;
  }

  async paginate() {
    const limit = this?.query?.limit ? Number(this?.query?.limit) : 10;
    const page = this?.query?.page ? Number(this?.query?.page) : 1;
    const skip = (page - 1) * limit;

    await this.countTotal();

    this.modelQuery = this?.modelQuery.skip(skip).limit(limit);

    return this;
  }

  fields() {
    const fields = this?.query?.fields
      ? (this.query.fields as string).split(",").join(" ")
      : "-__v";

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }
}

export default QueryBuilder;
